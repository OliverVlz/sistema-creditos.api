import { LoanStatus } from '../../infrastructure/entity/loan.entity';

export class UpdateLoanCommand {
  readonly id: string;
  readonly status?: LoanStatus;
  readonly rejectionReason?: string;
  readonly managerId?: string;
  readonly updatedBy: string;
  readonly updatedByRole: string;
  readonly documents?: { id: string; url: string }[];

  constructor(params: UpdateLoanCommand) {
    Object.assign(this, params);
  }
}
