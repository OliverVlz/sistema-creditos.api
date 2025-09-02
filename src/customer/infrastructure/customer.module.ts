import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { CustomersController } from './customer.controller';
import { Customer } from './entity/customer.entity';
import { CustomerRepository } from './repositories/customer.repository';
import { CreateCustomerHandler } from '../application/create-customer/create-customer.handler';
import { DeleteCustomerHandler } from '../application/delete-customer/delete-customer.handler';
import { GetCustomerByIdHandler } from '../application/get-customer-by-id/get-customer-by-id.handler';
import { GetCustomersHandler } from '../application/get-customers/get-customers.handler';
import { UpdateCustomerHandler } from '../application/update-customer/update-customer.handler';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([Customer])
  ],
  controllers: [CustomersController],
  providers: [
    CustomerRepository,
    CreateCustomerHandler,
    DeleteCustomerHandler,
    GetCustomerByIdHandler,
    GetCustomersHandler,
    UpdateCustomerHandler,
  ],
  exports: [CustomerRepository, TypeOrmModule],
})
export class CustomersModule {}