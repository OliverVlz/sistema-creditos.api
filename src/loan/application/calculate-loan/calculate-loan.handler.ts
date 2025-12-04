import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CalculateLoanQuery } from './calculate-loan.query';
import { LoanTypeRepository } from 'src/loan-type/infrastructure/repositories/loan-type.repository';
import { LoanCalculatorService } from '../../domain/loan-calculator.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

@QueryHandler(CalculateLoanQuery)
export class CalculateLoanHandler implements IQueryHandler<CalculateLoanQuery> {
  constructor(
    private readonly loanTypeRepository: LoanTypeRepository,
    private readonly loanCalculatorService: LoanCalculatorService,
  ) {}

  async execute(query: CalculateLoanQuery) {
    const { loanTypeName, amountRequested, termMonths } = query;

    const loanType = await this.loanTypeRepository.findByName(loanTypeName);
    if (!loanType) {
      throw new NotFoundException(
        `Tipo de préstamo "${loanTypeName}" no encontrado`,
      );
    }

    if (
      amountRequested < loanType.minAmount ||
      amountRequested > loanType.maxAmount
    ) {
      throw new BadRequestException(
        `Monto fuera de los límites (${loanType.minAmount}-${loanType.maxAmount})`,
      );
    }

    if (termMonths < loanType.minTerm || termMonths > loanType.maxTerm) {
      throw new BadRequestException(
        `Plazo fuera de los límites (${loanType.minTerm}-${loanType.maxTerm} meses)`,
      );
    }

    const annualInterestRate = Number(loanType.interestRate);

    const calculation = this.loanCalculatorService.calculate({
      amountRequested,
      termMonths,
      annualInterestRate,
      vatRate: 0,
    });

    return {
      amountRequested,
      termMonths,
      annualInterestRate,
      monthlyRate: calculation.monthlyRate,
      monthlyPayment: calculation.monthlyPayment,
      totalInterest: calculation.totalInterest,
      totalPayable: calculation.totalPayable,
      loanType: {
        id: loanType.id,
        name: loanType.name,
      },
    };
  }
}
