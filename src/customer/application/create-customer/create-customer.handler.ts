import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';

import { DomainError } from 'src/shared/domain';

import { CustomerRepository } from '../../infrastructure/repositories/customer.repository';
import { CreateCustomerCommand } from './create-customer.command';

@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler implements ICommandHandler<CreateCustomerCommand> {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: CreateCustomerCommand) {
    try {
      return await this.customerRepository.create(command);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        // Código de error de clave duplicada para MySQL es '1062'
        if (error.driverError && error.driverError.code === '1062') {
          throw new DomainError(
            'CUSTOMER_ALREADY_EXISTS',
            `Customer with document number '${command.documentNumber}' already exists.`,
          );
        }
      }
      throw error;
    }
  }
} 