export class CalculateLoanQuery {
  readonly loanTypeName: string;
  readonly amountRequested: number;
  readonly termMonths: number;

  constructor(params: CalculateLoanQuery) {
    Object.assign(this, params);
  }
}
