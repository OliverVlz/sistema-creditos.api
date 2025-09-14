import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteLoanTypeCommand } from './delete-loan-type.command';
import { LoanTypeRepository } from '../../infrastructure/repositories/loan-type.repository';
import { NotFoundException } from '@nestjs/common';

@CommandHandler(DeleteLoanTypeCommand)
export class DeleteLoanTypeHandler implements ICommandHandler<DeleteLoanTypeCommand> {
  constructor(private readonly loanTypeRepository: LoanTypeRepository) {}

  async execute(command: DeleteLoanTypeCommand): Promise<any> {
    const { id, deletedBy } = command;

    const existingLoanType = await this.loanTypeRepository.findOne(id);
    if (!existingLoanType) {
      throw new NotFoundException(`LoanType with ID ${id} not found`);
    }

    await this.loanTypeRepository.softDelete(id, deletedBy);

    return { success: true, message: `LoanType with ID ${id} soft-deleted` };
  }
}



