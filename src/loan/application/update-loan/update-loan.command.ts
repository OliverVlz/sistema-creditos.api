import { LoanStatus } from '../../infrastructure/entity/loan.entity';

export class UpdateLoanCommand {
  readonly id: string;
  readonly loanTypeId?: string;
  readonly clientId?: string;
  readonly organizationId?: string;
  readonly amountRequested?: number;
  readonly interestRate?: number;
  readonly termMonths?: number;
  readonly monthlyPayment?: number;
  readonly status?: LoanStatus;
  readonly rejectionReason?: string;
  readonly approvedBy?: string;
  readonly approvedAt?: Date;
  readonly signedAt?: Date;
  readonly disbursedAt?: Date;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly notes?: string;
  readonly updatedBy: string;

  constructor(params: UpdateLoanCommand) {
    Object.assign(this, params);
  }
}
