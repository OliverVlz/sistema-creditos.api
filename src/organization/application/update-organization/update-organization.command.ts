export class UpdateOrganizationCommand {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly baseInterestRate?: number;
  readonly discountRate?: number;
  readonly taxRate?: number;
  readonly isActive?: boolean;
  readonly updatedBy: string;

  constructor(params: UpdateOrganizationCommand) {
    Object.assign(this, params);
  }
}
