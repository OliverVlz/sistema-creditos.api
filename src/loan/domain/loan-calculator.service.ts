import { Injectable, BadRequestException } from '@nestjs/common';

export interface LoanCalculationInput {
  amountRequested: number;
  termMonths: number;
  annualInterestRate: number;
  vatRate: number;
}

export interface LoanCalculationResult {
  monthlyRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalTax: number;
  totalPayable: number;
}

export interface LoanValidationInput {
  amountRequested: number;
  termMonths: number;
  annualInterestRate: number;
  frontendMonthlyPayment: number;
  frontendTotalInterest: number;
  frontendTotalPayable: number;
}

@Injectable()
export class LoanCalculatorService {
  private readonly TOLERANCE_PERCENTAGE = 0.01;

  calculate(input: LoanCalculationInput): LoanCalculationResult {
    const { amountRequested, termMonths, annualInterestRate } = input;

    const monthlyRate = this.calculateEffectiveMonthlyRate(annualInterestRate);

    let monthlyPayment: number;
    if (monthlyRate === 0) {
      monthlyPayment = amountRequested / termMonths;
    } else {
      monthlyPayment =
        (amountRequested *
          (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);
    }

    monthlyPayment = this.round(monthlyPayment);
    const totalPayable = Math.round(monthlyPayment * termMonths);
    const totalInterest = Math.round(totalPayable - amountRequested);

    return {
      monthlyRate,
      monthlyPayment,
      totalInterest,
      totalTax: 0,
      totalPayable,
    };
  }

  validateAndCalculate(input: LoanValidationInput): LoanCalculationResult {
    const calculated = this.calculate({
      amountRequested: input.amountRequested,
      termMonths: input.termMonths,
      annualInterestRate: input.annualInterestRate,
      vatRate: 0,
    });

    const errors: string[] = [];

    if (
      !this.isWithinTolerance(
        input.frontendMonthlyPayment,
        calculated.monthlyPayment,
      )
    ) {
      errors.push(
        `Pago mensual inválido: esperado ${calculated.monthlyPayment}, recibido ${input.frontendMonthlyPayment}`,
      );
    }

    if (
      !this.isWithinTolerance(
        input.frontendTotalInterest,
        calculated.totalInterest,
      )
    ) {
      errors.push(
        `Total intereses inválido: esperado ${calculated.totalInterest}, recibido ${input.frontendTotalInterest}`,
      );
    }

    if (
      !this.isWithinTolerance(
        input.frontendTotalPayable,
        calculated.totalPayable,
      )
    ) {
      errors.push(
        `Total a pagar inválido: esperado ${calculated.totalPayable}, recibido ${input.frontendTotalPayable}`,
      );
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Los cálculos del préstamo no coinciden',
        errors,
        expected: calculated,
      });
    }

    return calculated;
  }

  private calculateEffectiveMonthlyRate(annualRate: number): number {
    if (annualRate === 0) return 0;
    const rate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    return this.roundRate(rate);
  }

  private roundRate(value: number): number {
    return Math.round(value * 1000000) / 1000000;
  }

  private isWithinTolerance(
    frontendValue: number,
    calculatedValue: number,
  ): boolean {
    if (calculatedValue === 0) return frontendValue === 0;
    const percentageDiff =
      Math.abs(frontendValue - calculatedValue) / calculatedValue;
    return percentageDiff <= this.TOLERANCE_PERCENTAGE;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
