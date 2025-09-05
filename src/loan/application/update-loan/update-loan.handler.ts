import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanCommand } from './update-loan.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { NotFoundException } from '@nestjs/common';
import { Loan, LoanStatus } from '../../infrastructure/entity/loan.entity';

@CommandHandler(UpdateLoanCommand)
export class UpdateLoanHandler implements ICommandHandler<UpdateLoanCommand> {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(command: UpdateLoanCommand): Promise<Loan> {
    const existingLoan = await this.loanRepository.findOne(command.id);
    if (!existingLoan) {
      throw new NotFoundException('Préstamo no encontrado');
    }

    const { id, ...updateData } = command;
    const loanUpdateData: any = { ...updateData };

    // Recalculate monthly payment if amount, interest rate, or term changes
    if (updateData.amount !== undefined || updateData.interestRate !== undefined || updateData.termMonths !== undefined) {
      const amount = updateData.amount ?? existingLoan.amount;
      const interestRate = updateData.interestRate ?? existingLoan.interestRate;
      const termMonths = updateData.termMonths ?? existingLoan.termMonths;
      
      const monthlyInterestRate = interestRate / 100 / 12;
      const monthlyPayment = amount * 
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths)) /
        (Math.pow(1 + monthlyInterestRate, termMonths) - 1);
      
      loanUpdateData.monthlyPayment = Math.round(monthlyPayment * 100) / 100;
    }

    // Set approval data if status is being approved
    if (updateData.status === LoanStatus.APPROVED) {
      loanUpdateData.approvedBy = updateData.updatedBy;
      loanUpdateData.approvedAt = new Date();
    }

    // Convert date strings to Date objects if provided
    if (updateData.startDate !== undefined) {
      loanUpdateData.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
    }

    if (updateData.endDate !== undefined) {
      loanUpdateData.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    }

    return this.loanRepository.update(id, loanUpdateData);
  }
}
