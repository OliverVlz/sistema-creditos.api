export class CreateLoanDocumentsBatchCommand {
  readonly loanId: string;
  readonly documents: { documentTypeId: string; url: string }[];

  constructor(params: CreateLoanDocumentsBatchCommand) {
    Object.assign(this, params);
  }
}



