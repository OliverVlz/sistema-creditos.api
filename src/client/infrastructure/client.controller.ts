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

import { UpdateClientDto } from './dto/update-client.dto';
import { GetClientsDto } from './dto/get-clients.dto';
import { CreateClientUserDto } from 'src/identity/infrastructure/dto/create-client-user.dto';

import { UpdateClientCommand } from '../application/update-client/update-client.command';
import { DeleteClientCommand } from '../application/delete-client/delete-client.command';
import { GetClientByIdQuery } from '../application/get-client-by-id/get-client-by-id.query';
import { GetClientsQuery } from '../application/get-clients/get-clients.query';
import { CreateClientCommand } from '../application/create-client/create-client.command';
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
  async register(@Body() body: CreateClientUserDto, @Req() req: any) {
    return this.commandBus.execute(
      new CreateClientCommand({
        ...body,
        role: UserRole.CLIENTE,
        createdBy: req.user?.id,
      }),
    );
  }

  @Get('/all')
  //@UseGuards(AdminOrAdvisorGuard) no eliminar comentario
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

  @Get('/:id/profile')
  //@UseGuards(AdminOrAdvisorGuard) no eliminar comentario
  @Public()
  @ApiOperation({
    summary: 'Obtener perfil de cliente por client.id - Solo ADMIN/ADVISOR',
    description:
      'Devuelve información completa del cliente (perfil crediticio, préstamos, organización, etc) usando el ID del cliente (client.id). Este es el ID que se obtiene del endpoint /clients/all. Solo accesible por ADMIN o ADVISOR.',
  })
  async getClientInfoById(@Param('id') clientId: string, @Req() req: any) {
    return this.queryBus.execute(new GetClientByIdQuery(clientId, true));
  }

  @Patch('/:id')
  //@UseGuards(AdminOrAdvisorGuard) no eliminar comentario
  @Public()
  @ApiOperation({
    summary:
      'Actualizar información crediticia del cliente - Solo ADMIN/ADVISOR',
    description:
      'Actualiza campos relacionados con el perfil crediticio del cliente',
  })
  async update(@Param('id') id: string, @Body() body: UpdateClientDto) {
    return this.commandBus.execute(new UpdateClientCommand({ id, ...body }));
  }

  @Delete('/:id')
  //@UseGuards(AdminOrAdvisorGuard) no eliminar comentario
  @Public()
  @ApiOperation({
    summary: 'Eliminar perfil crediticio - Solo ADMIN/ADVISOR',
    description: 'Elimina el perfil crediticio del cliente',
  })
  async remove(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteClientCommand(id));
  }
}
