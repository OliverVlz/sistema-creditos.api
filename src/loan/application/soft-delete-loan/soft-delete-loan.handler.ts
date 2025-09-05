import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SoftDeleteLoanCommand } from './soft-delete-loan.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';

@CommandHandler(SoftDeleteLoanCommand)
export class SoftDeleteLoanHandler implements ICommandHandler<SoftDeleteLoanCommand> {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(command: SoftDeleteLoanCommand): Promise<void> {
    return this.loanRepository.softDelete(command.id, command.deletedBy);
  }
}
