import { LoanStatus } from '../../infrastructure/entity/loan.entity';

export class UpdateLoanCommand {
  readonly id: string;
  readonly amount?: number;
  readonly interestRate?: number;
  readonly termMonths?: number;
  readonly status?: LoanStatus;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly notes?: string;
  readonly updatedBy: string;

  constructor(params: UpdateLoanCommand) {
    Object.assign(this, params);
  }
}
