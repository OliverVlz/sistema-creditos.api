export class CreateClientCommand {
  readonly userId: string;
  readonly organizationId: string;
  readonly creditScore?: number;
  readonly maxCreditLimit?: number;
  readonly riskLevel?: string;
  readonly createdBy: string;

  constructor(params: CreateClientCommand) {
    Object.assign(this, params);
  }
}
