import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateLoanCommand } from './create-loan.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { ConflictException } from '@nestjs/common';
import { Loan } from '../../infrastructure/entity/loan.entity';

@CommandHandler(CreateLoanCommand)
export class CreateLoanHandler implements ICommandHandler<CreateLoanCommand> {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(command: CreateLoanCommand): Promise<Loan> {
    // Generate unique loan number
    const loanNumber = await this.loanRepository.generateLoanNumber();

    // Calculate monthly payment (simple interest calculation)
    const monthlyInterestRate = command.interestRate / 100 / 12;
    const monthlyPayment = command.amount * 
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, command.termMonths)) /
      (Math.pow(1 + monthlyInterestRate, command.termMonths) - 1);

    const loanData = {
      loanNumber,
      clientId: command.clientId,
      organizationId: command.organizationId,
      amount: command.amount,
      interestRate: command.interestRate,
      termMonths: command.termMonths,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100, // Round to 2 decimal places
      startDate: command.startDate ? new Date(command.startDate) : undefined,
      notes: command.notes,
      createdBy: command.createdBy,
    };

    return this.loanRepository.create(loanData);
  }
}
