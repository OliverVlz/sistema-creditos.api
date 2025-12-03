export class CreateLoanCommand {
  readonly clientId: string;
  readonly loanTypeId: string;
  readonly organizationId: string;
  readonly amountRequested: number;
  readonly termMonths: number;
  readonly monthlyPayment: number;
  readonly totalInterest: number;
  readonly totalPayable: number;

  constructor(params: CreateLoanCommand) {
    Object.assign(this, params);
  }
}
