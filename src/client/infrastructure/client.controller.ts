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
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { UpdateClientAdminDto } from './dto/update-client-admin.dto';
import { GetClientsDto } from './dto/get-clients.dto';
import { CreateClientDto } from './dto/create-client.dto';

import { CreateClientCommand } from '../application/create-client/create-client.command';

import { UpdateClientProfileCommand } from '../application/update-client-profile/update-client-profile.command';
import { UpdateClientAdminCommand } from '../application/update-client-admin/update-client-admin.command';
import { GetClientByIdQuery } from '../application/get-client-by-id/get-client-by-id.query';
import { GetClientsQuery } from '../application/get-clients/get-clients.query';
import { AdminOrAdvisorGuard } from 'src/shared/guards';
import { UserRole } from 'src/shared/enums';
import { Public } from 'src/shared/validation';

@ApiTags('Clients')
@Controller('clients')
@ApiBearerAuth()
export class ClientsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
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

  @Get('/all')
  //@UseGuards(AdminOrAdvisorGuard)
  @Public()
  @ApiOperation({
    summary: 'Listar clientes para dashboard - Solo ADMIN/ADVISOR',
    description:
      'Devuelve lista optimizada de clientes con información esencial para tabla de dashboard. Permite filtrar por organizationId, términos de búsqueda, estado activo y estado de empleo.',
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
      'employmentStatus, organizationId (solo asignar a otra organización), isActive. ' +
      'NOTA: Los datos internos de la organización (tasas, descuentos, etc.) NO se pueden modificar desde aquí. ' +
      'Se gestionan desde el módulo de organizaciones.',
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
}
