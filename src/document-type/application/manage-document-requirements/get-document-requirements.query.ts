export class GetDocumentRequirementsQuery {
  readonly loanTypeId: string;

  constructor(loanTypeId: string) {
    this.loanTypeId = loanTypeId;
  }
}

