export class CalculateLoanQuery {
  readonly loanTypeId: string;
  readonly amountRequested: number;
  readonly termMonths: number;

  constructor(params: CalculateLoanQuery) {
    Object.assign(this, params);
  }
}



