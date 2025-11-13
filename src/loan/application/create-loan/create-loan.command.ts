export class CreateLoanCommand {
  readonly clientId: string;
  readonly loanTypeId: string;
  readonly organizationId: string;
  readonly amountRequested: number; 
  readonly interestRate: number;
  readonly termMonths: number;
  readonly monthlyPayment: number;
  readonly notes?: string; 

  constructor(params: CreateLoanCommand) {
    Object.assign(this, params);
  }
}
