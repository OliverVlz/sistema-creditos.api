export class ValidateRequiredDocumentsQuery {
  readonly loanTypeId: string;
  readonly clientId: string;

  constructor(loanTypeId: string, clientId: string) {
    this.loanTypeId = loanTypeId;
    this.clientId = clientId;
  }
}

