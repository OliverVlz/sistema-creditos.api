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
import { GetUsersClientInfoByIdQuery } from '../application/get-users-client-info-by-id/get-users-client-info-by-id.query';
import { GetUsersClientInfoQuery } from '../application/get-users-client-info/get-users-client-info.query';
import { CreateUserClientCommand } from 'src/identity/application/create-user-client/create-user-client.command';
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
  //@UseGuards(AdminOrAdvisorGuard) no eliminar comentario
  @Public()
  @ApiOperation({
    summary: 'Registrar nuevo cliente - Solo ADMIN/ADVISOR',
    description:
      'Permite a Admin o Advisor crear un nuevo cliente (User + Client) con trazabilidad de quién lo creó',
  })
  async registerClient(@Body() body: CreateClientUserDto, @Req() req: any) {
    return this.commandBus.execute(
      new CreateUserClientCommand({
        ...body,
        role: UserRole.CLIENTE,
        createdBy: req.user.id,
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
    return this.queryBus.execute(new GetUsersClientInfoQuery(query));
  }

  @Get('/me/profile')
  @ApiOperation({
    summary: 'Obtener perfil de cliente del usuario autenticado',
    description:
      'Devuelve el perfil crediticio (información de cliente y préstamos) del usuario autenticado. Solo accesible por usuarios con rol CLIENT.',
  })
  async getMyClientProfile(@Req() req: any) {
    return this.queryBus.execute(new GetUsersClientInfoByIdQuery(req.user.id));
  }

  @Get('/:userId/profile')
  //@UseGuards(AdminOrAdvisorGuard) no eliminar comentario
  @Public()
  @ApiOperation({
    summary: 'Obtener información de cliente por id - Solo ADMIN/ADVISOR',
    description:
      'Devuelve información de cliente (perfil crediticio, préstamos, etc) para el ID de usuario indicado. Solo accesible por ADMIN o ADVISOR.',
  })
  async getClientInfoById(@Param('userId') userId: string, @Req() req: any) {
    return this.queryBus.execute(new GetUsersClientInfoByIdQuery(userId));
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
