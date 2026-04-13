import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { CreateLoanDto } from './dto/create-loan.dto';
import { CreateLoanMultipartDto } from './dto/create-loan-multipart.dto';
import { UpdateLoanClientDto } from './dto/update-loan-client.dto';
import { UpdateLoanAdminDto } from './dto/update-loan-admin.dto';
import { GetLoansDto } from './dto/get-loans.dto';
import { CalculateLoanDto } from './dto/calculate-loan.dto';

import { CreateLoanCommand } from '../application/create-loan/create-loan.command';
import { CreateLoanWithFilesCommand } from '../application/create-loan-with-files/create-loan-with-files.command';
import { GetLoansQuery } from '../application/get-loans/get-loans.query';
import { UpdateLoanWithFilesCommand } from '../application/update-loan-with-files/update-loan-with-files.command';
import { SoftDeleteLoanCommand } from '../application/soft-delete-loan/soft-delete-loan.command';
import { GetLoanByIdQuery } from '../application/get-loan-by-id/get-loan-by-id.query';
import { CalculateLoanQuery } from '../application/calculate-loan/calculate-loan.query';
import { SendPreapprovalReminderCommand } from '../application/send-preapproval-reminder/send-preapproval-reminder.command';
import { UserRole } from 'src/shared/enums';
import { Public } from 'src/shared/validation/public.decorator';
import { AdminGuard, AdminOrAdvisorGuard } from 'src/shared/guards';
import { ApiConfig } from 'src/config/api.config';

@ApiTags('Loans')
@Controller('loans')
@ApiBearerAuth()
export class LoansController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly configService: ConfigService,
  ) {}

  @Post('/calculate')
  @Public()
  @ApiOperation({ summary: 'Calculate loan without creating it' })
  async calculate(@Body() body: CalculateLoanDto) {
    return this.queryBus.execute(new CalculateLoanQuery(body));
  }

  @Post('/')
  @ApiOperation({ summary: 'Create new loan (JSON - without files)' })
  async create(@Body() body: CreateLoanDto, @Req() req: any) {
    return this.commandBus.execute(
      new CreateLoanCommand({
        clientId: body.clientId,
        loanTypeName: body.loanTypeName,
        organizationName: body.organizationName,
        amountRequested: body.amountRequested,
        termMonths: body.termMonths,
        monthlyPayment: body.monthlyPayment,
        totalInterest: body.totalInterest,
        totalPayable: body.totalPayable,
        documents: body.documents,
      }),
    );
  }

  @Post('/with-documents')
  @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 archivos
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create new loan with document files (multipart)',
    description:
      'Crea un préstamo y sube los documentos adjuntos a MinIO en una sola operación. ' +
      'Los archivos se envían en el campo "files" y los códigos de tipo de documento ' +
      'en "documentTypeCodes" (mismo orden que los archivos).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          format: 'uuid',
          description: 'ID del cliente',
        },
        loanTypeName: {
          type: 'string',
          description: 'Nombre del tipo de préstamo (único)',
          example: 'Libranza',
        },
        organizationName: {
          type: 'string',
          description: 'Nombre de la organización (único)',
          example: 'Policía Nacional',
        },
        amountRequested: { type: 'number', example: 2000000 },
        termMonths: { type: 'number', example: 24 },
        monthlyPayment: { type: 'number', example: 104273.38 },
        totalInterest: { type: 'number', example: 502561 },
        totalPayable: { type: 'number', example: 2502561 },
        documentTypeCodes: {
          type: 'string',
          description: 'JSON array de códigos de tipo de documento',
          example: '["CEDULA", "NOMINA"]',
        },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async createWithDocuments(
    @Body() body: CreateLoanMultipartDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    // Validar que si hay archivos, haya códigos de documento correspondientes
    if (files?.length > 0) {
      if (
        !body.documentTypeCodes ||
        body.documentTypeCodes.length !== files.length
      ) {
        throw new BadRequestException(
          `Debe proporcionar ${files.length} códigos de tipo de documento (uno por cada archivo)`,
        );
      }
    }

    return this.commandBus.execute(
      new CreateLoanWithFilesCommand({
        clientId: body.clientId,
        loanTypeName: body.loanTypeName,
        organizationName: body.organizationName,
        amountRequested: body.amountRequested,
        termMonths: body.termMonths,
        monthlyPayment: body.monthlyPayment,
        totalInterest: body.totalInterest,
        totalPayable: body.totalPayable,
        documentTypeCodes: body.documentTypeCodes,
        files: files || [],
      }),
    );
  }

  @Get('/')
  @ApiOperation({
    summary: 'Search loans with optional filters and pagination',
  })
  async searchLoans(@Query() query: GetLoansDto) {
    return this.queryBus.execute(new GetLoansQuery(query));
  }

  @Get('/preapproval-contract-template')
  @ApiOperation({
    summary: 'Download preapproval contract template',
  })
  async getPreapprovalContractTemplate(
    @Res({ passthrough: true }) res: Response,
  ) {
    const apiConfig = this.configService.get<ApiConfig>('api');
    const templateUrl = apiConfig?.loanContractTemplateUrl;

    if (!templateUrl) {
      throw new BadRequestException(
        'No hay plantilla de contrato configurada para preaprobación',
      );
    }

    return res.redirect(templateUrl);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get loan detail by ID' })
  async getLoanById(@Param('id') id: string, @Req() req: any) {
    return this.queryBus.execute(
      new GetLoanByIdQuery(id, req.user.id, req.user.role),
    );
  }

  // ============================================
  // ENDPOINTS DE ACTUALIZACIÓN POR ROL
  // ============================================

  @Patch('/:id/documents')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update loan documents (Client)',
    description:
      'Endpoint para CLIENTES. Permite:\n' +
      '- Agregar nuevos documentos\n' +
      '- Reemplazar documentos existentes\n\n' +
      'NO permite cambiar status, rejectionReason ni managerId.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newDocumentTypeCodes: {
          type: 'string',
          description: 'JSON array de códigos para archivos NUEVOS',
          example: '["CEDULA", "NOMINA"]',
        },
        replaceDocumentIds: {
          type: 'string',
          description: 'JSON array de IDs de documentos a REEMPLAZAR',
          example: '["uuid-doc-1", "uuid-doc-2"]',
        },
        files: {
          type: 'array',
          description: 'Archivos: primero los nuevos, luego los de reemplazo',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async updateLoanDocuments(
    @Param('id') id: string,
    @Body() body: UpdateLoanClientDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const { newFiles, replaceFiles } = this.splitFiles(
      files,
      body.newDocumentTypeCodes?.length || 0,
      body.replaceDocumentIds?.length || 0,
    );

    return this.commandBus.execute(
      new UpdateLoanWithFilesCommand({
        loanId: id,
        updatedBy: req.user.id,
        updatedByRole: req.user.role,
        newDocumentTypeCodes: body.newDocumentTypeCodes,
        newFiles,
        replaceDocumentIds: body.replaceDocumentIds,
        replaceFiles,
      }),
    );
  }

  @Patch('/:id/manage')
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Manage loan (Admin/Advisor only)',
    description:
      'Endpoint para ADMIN/ASESOR. Permite:\n' +
      '- Cambiar status del préstamo\n' +
      '- Agregar razón de rechazo\n' +
      '- Asignar manager\n' +
      '- Agregar/reemplazar documentos',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pendiente', 'preaprobado', 'aprobado', 'rechazado', 'desembolsado'],
        },
        rejectionReason: {
          type: 'string',
          example: 'Documentación incompleta',
        },
        managerId: { type: 'string', format: 'uuid' },
        newDocumentTypeCodes: {
          type: 'string',
          description: 'JSON array de códigos para archivos NUEVOS',
          example: '["CEDULA", "NOMINA"]',
        },
        replaceDocumentIds: {
          type: 'string',
          description: 'JSON array de IDs de documentos a REEMPLAZAR',
          example: '["uuid-doc-1", "uuid-doc-2"]',
        },
        files: {
          type: 'array',
          description: 'Archivos: primero los nuevos, luego los de reemplazo',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async manageLoan(
    @Param('id') id: string,
    @Body() body: UpdateLoanAdminDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    // Validar que solo admin/asesor pueden usar este endpoint
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.ASESOR) {
      throw new BadRequestException(
        'Solo administradores o asesores pueden usar este endpoint',
      );
    }

    const { newFiles, replaceFiles } = this.splitFiles(
      files,
      body.newDocumentTypeCodes?.length || 0,
      body.replaceDocumentIds?.length || 0,
    );

    return this.commandBus.execute(
      new UpdateLoanWithFilesCommand({
        loanId: id,
        status: body.status,
        rejectionReason: body.rejectionReason,
        managerId: body.managerId,
        updatedBy: req.user.id,
        updatedByRole: req.user.role,
        newDocumentTypeCodes: body.newDocumentTypeCodes,
        newFiles,
        replaceDocumentIds: body.replaceDocumentIds,
        replaceFiles,
      }),
    );
  }

  /**
   * Helper para dividir archivos entre nuevos y reemplazos
   */
  private splitFiles(
    files: Express.Multer.File[] | undefined,
    newCodesCount: number,
    replaceIdsCount: number,
  ): { newFiles: Express.Multer.File[]; replaceFiles: Express.Multer.File[] } {
    const filesCount = files?.length || 0;
    let newFiles: Express.Multer.File[] = [];
    let replaceFiles: Express.Multer.File[] = [];

    if (newCodesCount > 0 && replaceIdsCount > 0) {
      if (filesCount !== newCodesCount + replaceIdsCount) {
        throw new BadRequestException(
          `Se esperaban ${newCodesCount + replaceIdsCount} archivos (${newCodesCount} nuevos + ${replaceIdsCount} reemplazos), pero se recibieron ${filesCount}`,
        );
      }
      newFiles = files!.slice(0, newCodesCount);
      replaceFiles = files!.slice(newCodesCount);
    } else if (newCodesCount > 0) {
      if (filesCount !== newCodesCount) {
        throw new BadRequestException(
          `Se esperaban ${newCodesCount} archivos nuevos, pero se recibieron ${filesCount}`,
        );
      }
      newFiles = files || [];
    } else if (replaceIdsCount > 0) {
      if (filesCount !== replaceIdsCount) {
        throw new BadRequestException(
          `Se esperaban ${replaceIdsCount} archivos de reemplazo, pero se recibieron ${filesCount}`,
        );
      }
      replaceFiles = files || [];
    }

    return { newFiles, replaceFiles };
  }

  @Delete('/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Soft delete loan' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.commandBus.execute(new SoftDeleteLoanCommand(id, req.user.id));
  }

  @Patch('/:id/send-preapproval-reminder')
  @UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({ summary: 'Send preapproval reminder email to client' })
  async sendPreapprovalReminder(@Param('id') id: string, @Req() req: any) {
    return this.commandBus.execute(
      new SendPreapprovalReminderCommand(id, req.user.id),
    );
  }
}
