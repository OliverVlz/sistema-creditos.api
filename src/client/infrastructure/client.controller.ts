import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { ApiConfig } from 'src/config/api.config';

import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { UpdateClientAdminDto } from './dto/update-client-admin.dto';
import { GetClientsDto } from './dto/get-clients.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { BulkImportClientsLoansDto } from './dto/bulk-import-clients-loans.dto';

import { CreateClientCommand } from '../application/create-client/create-client.command';
import {
  ImportedClientsLoansFile,
  ImportClientsLoansCommand,
} from '../application/import-clients-loans/import-clients-loans.command';
import { buildClientsLoansTemplateBuffer } from '../application/import-clients-loans/import-clients-loans.excel';

import { UpdateClientProfileCommand } from '../application/update-client-profile/update-client-profile.command';
import { UpdateClientAdminCommand } from '../application/update-client-admin/update-client-admin.command';
import { DeleteClientAdminCommand } from '../application/delete-client-admin/delete-client-admin.command';
import { GetClientByIdQuery } from '../application/get-client-by-id/get-client-by-id.query';
import { GetClientsQuery } from '../application/get-clients/get-clients.query';
import { AdminGuard, AdminOrAdvisorGuard } from 'src/shared/guards';
import { UserRole } from 'src/shared/enums';
import { Public } from 'src/shared/validation';

@ApiTags('Clients')
@Controller('clients')
@ApiBearerAuth()
export class ClientsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly configService: ConfigService,
  ) {}

  @Post('/register')
  @Public()
  @ApiOperation({
    summary: 'Registrar nuevo cliente',
    description:
      'Registra un nuevo cliente en el sistema (User + Client). ' +
      'Puede ser usado para auto-registro público (sin autenticación) o ' +
      'por Admin/Advisor (con autenticación para trazabilidad). ' +
      'Si hay un usuario autenticado, se registra automáticamente quién creó el cliente.',
  })
  async register(@Body() body: CreateClientDto, @Req() req: any) {
    return this.commandBus.execute(
      new CreateClientCommand({
        ...body,
        role: UserRole.CLIENTE,
      }),
    );
  }

  @Get('/import/clients-loans/template')
  @UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({
    summary: 'Descargar plantilla de carga masiva de clientes y solicitudes',
  })
  async downloadClientsLoansTemplate(
    @Res({ passthrough: true }) res: Response,
  ) {
    const apiConfig = this.configService.get<ApiConfig>('api');
    const templateUrl = apiConfig?.massiveImportTemplateUrl;

    if (templateUrl) {
      return res.redirect(templateUrl);
    }

    const fileBuffer = buildClientsLoansTemplateBuffer();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="plantilla-clientes-solicitudes.xlsx"',
    );
    return fileBuffer;
  }

  @Post('/import/clients-loans')
  @UseGuards(AdminOrAdvisorGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de carga masiva (.xlsx o .csv)',
        },
        chunkSize: {
          type: 'number',
          description: 'Cantidad de filas por lote',
          default: 20,
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary: 'Importar clientes nuevos y sus solicitudes desde Excel',
  })
  async importClientsLoans(
    @UploadedFile() file: ImportedClientsLoansFile,
    @Body() body: BulkImportClientsLoansDto,
  ) {
    return this.commandBus.execute(
      new ImportClientsLoansCommand({
        file,
        chunkSize: body.chunkSize,
      }),
    );
  }

  @Get('/all')
  //@UseGuards(AdminOrAdvisorGuard)
  @Public()
  @ApiOperation({
    summary: 'Listar clientes para dashboard - Solo ADMIN/ADVISOR',
    description:
      'Devuelve lista optimizada de clientes con información esencial para tabla de dashboard. Permite filtrar por organizationId, términos de búsqueda, estado activo, estado de empleo y si fue cargado por Excel (uploadedByExcel).',
  })
  async getUsersWithClientInfo(@Query() query: GetClientsDto) {
    return this.queryBus.execute(new GetClientsQuery(query));
  }

  @Get('/me/profile')
  @ApiOperation({
    summary: 'Obtener perfil del cliente autenticado',
    description:
      'Devuelve el perfil crediticio completo (información personal, préstamos, organización, etc) del usuario autenticado. Busca el cliente usando el user.id del token JWT. Solo accesible por usuarios con rol CLIENT.',
  })
  async getMyClientProfile(@Req() req: any) {
    return this.queryBus.execute(new GetClientByIdQuery(req.user.id));
  }

  @Get('/:userId/profile')
  //@UseGuards(AdminOrAdvisorGuard)
  @Public()
  @ApiOperation({
    summary: 'Obtener perfil de cliente por userId - Solo ADMIN/ADVISOR',
    description:
      'Devuelve información completa del cliente (perfil crediticio, préstamos, organización, etc) usando el userId. Solo accesible por ADMIN o ADVISOR.',
  })
  async getClientInfoById(@Param('userId') userId: string) {
    return this.queryBus.execute(new GetClientByIdQuery(userId));
  }

  @Patch('/me/profile')
  @ApiOperation({
    summary: 'Actualizar perfil del cliente autenticado',
    description:
      'Permite al cliente actualizar su propia información: ' +
      'nombres, apellidos, dirección, teléfono, fecha de nacimiento, estado laboral y organización. ' +
      'NO puede modificar: email, documento de identidad, ni estado activo/inactivo.',
  })
  async updateMyProfile(@Req() req: any, @Body() body: UpdateClientProfileDto) {
    return this.commandBus.execute(
      new UpdateClientProfileCommand({
        userId: req.user.id,
        ...body,
      }),
    );
  }

  @Patch('/:userId')
  //@UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({
    summary: 'Actualizar cliente completo - Solo ADMIN/ADVISOR',
    description:
      'Permite al Admin/Advisor actualizar los campos del cliente y usuario. ' +
      'Campos editables: firstName, lastName, email, phoneNumber, address, birthDate, ' +
      'employmentStatus, organizationId, isActive.',
  })
  async updateClientAsAdmin(
    @Param('userId') userId: string,
    @Body() body: UpdateClientAdminDto,
    @Req() req: any,
  ) {
    return this.commandBus.execute(
      new UpdateClientAdminCommand({
        userId,
        updater: req.user?.id,
        ...body,
      }),
    );
  }

  @Delete('/:userId')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Eliminar cliente y solicitudes relacionadas - Solo ADMIN',
  })
  async deleteClient(@Param('userId') userId: string) {
    return this.commandBus.execute(
      new DeleteClientAdminCommand({
        userId,
      }),
    );
  }
}
