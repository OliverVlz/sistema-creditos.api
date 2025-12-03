import { LoanStatus } from '../../infrastructure/entity/loan.entity';

export class UpdateLoanCommand {
  readonly id: string;
  readonly status?: LoanStatus;
  readonly rejectionReason?: string;
  readonly managerId?: string;
  readonly updatedBy: string;

  constructor(params: UpdateLoanCommand) {
    Object.assign(this, params);
  }
}
