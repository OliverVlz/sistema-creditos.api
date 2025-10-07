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

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

import { CreateClientCommand } from '../application/create-client/create-client.command';
import { UpdateClientCommand } from '../application/update-client/update-client.command';
import { DeleteClientCommand } from '../application/delete-client/delete-client.command';
import { GetClientByIdQuery } from '../application/get-client-by-id/get-client-by-id.query';
import { GetUsersClientInfoByIdQuery } from '../application/get-users-client-info-by-id/get-users-client-info-by-id.query';
import { GetUsersClientInfoQuery } from '../application/get-users-client-info/get-users-client-info.query';
import { AdminOrAdvisorGuard } from 'src/shared/guards';

@ApiTags('Clients')
@Controller('clients')
@ApiBearerAuth()
export class ClientsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  @ApiOperation({ 
    summary: 'Create client credit profile for existing user',
    description: 'Admin/Advisor only: Creates credit information for an existing user with CLIENT role'
  })
  async create(@Body() body: CreateClientDto, @Req() req: any) {
    return this.commandBus.execute(new CreateClientCommand({
      ...body,
      createdBy: req.user.id,
    }));
  }

  @Get('/all')
  @UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({
    summary: 'Obtener clientes con información crediticia - Solo ADMIN/ADVISOR',
    description: 'Devuelve usuarios con rol CLIENT y su perfil crediticio asociado'
  })
  async getUsersWithClientInfo(@Query() query: GetUsersClientInfoQuery) {
    return this.queryBus.execute(new GetUsersClientInfoQuery(query));
  }

  @Get('/me/profile')
  @ApiOperation({
    summary: 'Obtener perfil de cliente del usuario autenticado - Solo CLIENT',
    description: 'Devuelve el perfil crediticio (información de cliente y préstamos) del usuario autenticado. Solo accesible por usuarios con rol CLIENT.'
  })
  async getMyClientProfile(@Req() req: any) {
    return this.queryBus.execute(new GetUsersClientInfoByIdQuery(req.user.id));
  }

  @Get('/:userId/profile')
  @UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({
    summary: 'Obtener información de cliente por id - Solo ADMIN/ADVISOR',
    description: 'Devuelve información de cliente (perfil crediticio, préstamos, etc) para el ID de usuario indicado. Solo accesible por ADMIN o ADVISOR.'
  })
  async getClientInfoById(@Param('userId') userId: string, @Req() req: any) {
    return this.queryBus.execute(new GetUsersClientInfoByIdQuery(userId));
  }

  @Get('/:id')
  @ApiOperation({ 
    summary: 'Get client by ID',
    description: 'Get client credit profile and user information'
  })
  async getClientById(@Param('id') id: string) {
    return this.queryBus.execute(new GetClientByIdQuery(id));
  }

  @Patch('/:id')
  @ApiOperation({ 
    summary: 'Update client credit information',
    description: 'Update only credit-related fields. Use PATCH /users/:id for personal information'
  })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateClientDto,
  ) {
    return this.commandBus.execute(
      new UpdateClientCommand({ id, ...body }),
    );
  }

  @Delete('/:id')
  @ApiOperation({ 
    summary: 'Delete client credit profile',
    description: 'Removes credit profile but keeps the user record'
  })
  async remove(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteClientCommand(id));
  }
}
