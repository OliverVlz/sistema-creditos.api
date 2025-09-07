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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { GetClientsDto } from './dto/get-clients.dto';

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

  @Get('/')
  @ApiOperation({ 
    summary: 'Search clients with optional filters and pagination',
    description: 'Get clients with their credit information and user details'
  })
  async searchClients(@Query() query: GetClientsDto) {
    return this.queryBus.execute(new GetClientsQuery(query));
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
