export class CreateLoanDocumentCommand {
  readonly loanId: string;
  readonly documentTypeId: string;
  readonly url: string;

  constructor(params: CreateLoanDocumentCommand) {
    Object.assign(this, params);
  }
}

