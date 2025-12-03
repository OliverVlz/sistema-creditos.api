import { LoanDocumentStatus } from '../../infrastructure/entity/loan-document.entity';

export class UpdateLoanDocumentCommand {
  readonly id: string;
  readonly url?: string;
  readonly status?: LoanDocumentStatus;
  readonly rejectionNote?: string;

  constructor(params: UpdateLoanDocumentCommand) {
    Object.assign(this, params);
  }
}

