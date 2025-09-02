import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CustomerRepository } from '../../infrastructure/repositories/customer.repository';

import { DeleteCustomerCommand } from './delete-customer.command';

@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand> {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: DeleteCustomerCommand) {
    return this.customerRepository.remove(command.id);
  }
} 