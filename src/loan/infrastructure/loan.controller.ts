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

import { CreateLoanDto } from './dto/create-loan.dto';
import { CreateLoanMultipartDto } from './dto/create-loan-multipart.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { UpdateLoanMultipartDto } from './dto/update-loan-multipart.dto';
import { GetLoansDto } from './dto/get-loans.dto';
import { CalculateLoanDto } from './dto/calculate-loan.dto';

import { CreateLoanCommand } from '../application/create-loan/create-loan.command';
import { CreateLoanWithFilesCommand } from '../application/create-loan-with-files/create-loan-with-files.command';
import { GetLoansQuery } from '../application/get-loans/get-loans.query';
import { UpdateLoanCommand } from '../application/update-loan/update-loan.command';
import { UpdateLoanWithFilesCommand } from '../application/update-loan-with-files/update-loan-with-files.command';
import { SoftDeleteLoanCommand } from '../application/soft-delete-loan/soft-delete-loan.command';
import { GetLoanByIdQuery } from '../application/get-loan-by-id/get-loan-by-id.query';
import { CalculateLoanQuery } from '../application/calculate-loan/calculate-loan.query';

@ApiTags('Loans')
@Controller('loans')
@ApiBearerAuth()
export class LoansController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/calculate')
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
        clientId: { type: 'string', format: 'uuid', description: 'ID del cliente' },
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

  @Get('/:id')
  @ApiOperation({ summary: 'Get loan by ID' })
  async getLoanById(@Param('id') id: string) {
    return this.queryBus.execute(new GetLoanByIdQuery(id));
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Update loan (JSON - without files)' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateLoanDto,
    @Req() req: any,
  ) {
    return this.commandBus.execute(
      new UpdateLoanCommand({
        id,
        ...body,
        updatedBy: req.user.id,
      }),
    );
  }

  @Patch('/:id/with-documents')
  @UseInterceptors(FilesInterceptor('files', 20)) // Máximo 20 archivos (nuevos + reemplazos)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update loan with document files (multipart)',
    description:
      'Actualiza un préstamo y permite:\n' +
      '1. Agregar nuevos documentos (newFiles + newDocumentTypeCodes)\n' +
      '2. Reemplazar documentos existentes (replaceFiles + replaceDocumentIds)\n\n' +
      'Los archivos se envían todos en "files", primero los nuevos y luego los de reemplazo.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pendiente', 'aprobado', 'rechazado', 'desembolsado'],
        },
        rejectionReason: {
          type: 'string',
          example: 'Documentación incompleta',
        },
        managerId: { type: 'string', format: 'uuid' },
        newDocumentTypeCodes: {
          type: 'string',
          description: 'JSON array de códigos para archivos NUEVOS',
          example: '["CEDULA", "COMPROBANTE_INGRESOS"]',
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
  async updateWithDocuments(
    @Param('id') id: string,
    @Body() body: UpdateLoanMultipartDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const newCodesCount = body.newDocumentTypeCodes?.length || 0;
    const replaceIdsCount = body.replaceDocumentIds?.length || 0;
    const filesCount = files?.length || 0;

    // Determinar cuántos archivos van para cada operación
    let newFiles: Express.Multer.File[] = [];
    let replaceFiles: Express.Multer.File[] = [];

    if (newCodesCount > 0 && replaceIdsCount > 0) {
      // Caso: Ambas operaciones - archivos divididos
      if (filesCount !== newCodesCount + replaceIdsCount) {
        throw new BadRequestException(
          `Se esperaban ${newCodesCount + replaceIdsCount} archivos (${newCodesCount} nuevos + ${replaceIdsCount} reemplazos), pero se recibieron ${filesCount}`,
        );
      }
      newFiles = files.slice(0, newCodesCount);
      replaceFiles = files.slice(newCodesCount);
    } else if (newCodesCount > 0) {
      // Caso: Solo archivos nuevos
      if (filesCount !== newCodesCount) {
        throw new BadRequestException(
          `Se esperaban ${newCodesCount} archivos nuevos, pero se recibieron ${filesCount}`,
        );
      }
      newFiles = files;
    } else if (replaceIdsCount > 0) {
      // Caso: Solo reemplazos
      if (filesCount !== replaceIdsCount) {
        throw new BadRequestException(
          `Se esperaban ${replaceIdsCount} archivos de reemplazo, pero se recibieron ${filesCount}`,
        );
      }
      replaceFiles = files;
    }
    // Caso: Sin archivos - solo actualizar datos del préstamo (status, etc.)

    return this.commandBus.execute(
      new UpdateLoanWithFilesCommand({
        loanId: id,
        status: body.status,
        rejectionReason: body.rejectionReason,
        managerId: body.managerId,
        updatedBy: req.user.id,
        newDocumentTypeCodes: body.newDocumentTypeCodes,
        newFiles,
        replaceDocumentIds: body.replaceDocumentIds,
        replaceFiles,
      }),
    );
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Soft delete loan' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.commandBus.execute(new SoftDeleteLoanCommand(id, req.user.id));
  }
}
