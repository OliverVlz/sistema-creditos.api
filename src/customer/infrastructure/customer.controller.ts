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

import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { GetCustomerDto } from './dto/get-customer.dto';

import { CreateCustomerCommand } from '../application/create-customer/create-customer.command';
import { GetCustomersQuery } from '../application/get-customers/get-customers.query';
import { UpdateCustomerCommand } from '../application/update-customer/update-customer.command';
import { DeleteCustomerCommand } from '../application/delete-customer/delete-customer.command';
import { GetCustomerByIdQuery } from '../application/get-customer-by-id/get-customer-by-id.query';

@ApiTags('Customers')
@Controller('customers')
@ApiBearerAuth()
export class CustomersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'Create new customer' })
  async create(@Body() body: CreateCustomerDto) {
    return this.commandBus.execute(new CreateCustomerCommand(body));
  }

  @Get('/')
  @ApiOperation({ summary: 'Get all customers' })
  async searchCustomers(@Query() query: GetCustomerDto) {
    return this.queryBus.execute(new GetCustomersQuery(query));
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get customer by ID' })
  async getCustomerById(@Param('id') id: number) {
    return this.queryBus.execute(new GetCustomerByIdQuery(id));
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Update customer' })
  async update(
    @Param('id') id: number,
    @Body() body: UpdateCustomerDto,
  ) {
    return this.commandBus.execute(
      new UpdateCustomerCommand({ id, ...body }),
    );
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete customer' })
  async remove(@Param('id') id: number) {
    return this.commandBus.execute(new DeleteCustomerCommand(id));
  }
} 