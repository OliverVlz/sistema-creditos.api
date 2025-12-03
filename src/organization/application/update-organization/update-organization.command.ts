export class UpdateOrganizationCommand {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly isActive?: boolean;

  constructor(params: UpdateOrganizationCommand) {
    Object.assign(this, params);
  }
}
