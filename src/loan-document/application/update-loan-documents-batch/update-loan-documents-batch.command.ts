export class UpdateLoanDocumentsBatchCommand {
  readonly documents: { id: string; url: string }[];

  constructor(params: UpdateLoanDocumentsBatchCommand) {
    Object.assign(this, params);
  }
}




