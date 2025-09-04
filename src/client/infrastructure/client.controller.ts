import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { GetClientDto } from './dto/get-client.dto';

import { CreateClientCommand } from '../application/create-client/create-client.command';
import { GetClientsQuery } from '../application/get-clients/get-clients.query';
import { UpdateClientCommand } from '../application/update-client/update-client.command';
import { DeleteClientCommand } from '../application/delete-client/delete-client.command';
import { GetClientByIdQuery } from '../application/get-client-by-id/get-client-by-id.query';

@ApiTags('Clients')
@Controller('clients')
@ApiBearerAuth()
export class ClientsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'Create new client' })
  async create(@Body() body: CreateClientDto) {
    return this.commandBus.execute(new CreateClientCommand(body));
  }

  @Get('/')
  @ApiOperation({ summary: 'Search clients with optional filters and pagination' })
  async searchClients(@Query() query: GetClientDto) {
    return this.queryBus.execute(new GetClientsQuery(query));
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get client by ID' })
  async getClientById(@Param('id') id: number) {
    return this.queryBus.execute(new GetClientByIdQuery(id));
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Update client' })
  async update(
    @Param('id') id: number,
    @Body() body: UpdateClientDto,
  ) {
    return this.commandBus.execute(
      new UpdateClientCommand({ id, ...body }),
    );
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete client' })
  async remove(@Param('id') id: number) {
    return this.commandBus.execute(new DeleteClientCommand(id));
  }
}
