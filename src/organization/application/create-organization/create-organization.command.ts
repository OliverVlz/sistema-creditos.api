export class CreateOrganizationCommand {
  readonly name: string;
  readonly description?: string;
  readonly baseInterestRate: number;
  readonly discountRate: number;
  readonly taxRate: number;
  readonly createdBy: string;

  constructor(params: CreateOrganizationCommand) {
    Object.assign(this, params);
  }
}
