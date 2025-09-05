export class CreateLoanCommand {
  readonly clientId: string;
  readonly organizationId: string;
  readonly amount: number;
  readonly interestRate: number;
  readonly termMonths: number;
  readonly startDate?: string;
  readonly notes?: string;
  readonly createdBy: string;

  constructor(params: CreateLoanCommand) {
    Object.assign(this, params);
  }
}
