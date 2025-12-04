export class CreateLoanCommand {
  readonly clientId: string;
  readonly loanTypeName: string;
  readonly organizationName: string;
  readonly amountRequested: number;
  readonly termMonths: number;
  readonly monthlyPayment: number;
  readonly totalInterest: number;
  readonly totalPayable: number;
  readonly documents?: { documentTypeCode: string; url: string }[];

  constructor(params: CreateLoanCommand) {
    Object.assign(this, params);
  }
}
