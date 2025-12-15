export class UpdateLoanDocumentCommand {
  readonly id: string;
  readonly url: string;

  constructor(params: UpdateLoanDocumentCommand) {
    Object.assign(this, params);
  }
}




