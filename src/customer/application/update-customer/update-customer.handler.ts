import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCustomerCommand } from './update-customer.command';
import { CustomerRepository } from '../../infrastructure/repositories/customer.repository';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Customer } from '../../infrastructure/entity/customer.entity';

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler implements ICommandHandler<UpdateCustomerCommand> {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(command: UpdateCustomerCommand): Promise<Customer> {
    const existingCustomer = await this.customerRepository.findOne(command.id);
    if (!existingCustomer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (command.documentNumber && command.documentNumber !== existingCustomer.documentNumber) {
      const customerWithSameDocument = await this.customerRepository.findByDocumentNumber(command.documentNumber);
      if (customerWithSameDocument) {
        throw new ConflictException('Ya existe un cliente con ese número de documento');
      }
    }

    const customerData = {
      fullName: command.fullName,
      documentNumber: command.documentNumber,
      phone: command.phone,
      address: command.address,
    };

    const updatedCustomer = await this.customerRepository.update(command.id, customerData as Customer);
    return updatedCustomer;
  }
} 