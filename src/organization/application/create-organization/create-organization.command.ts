export class CreateOrganizationCommand {
  readonly name: string;
  readonly description?: string;

  constructor(params: CreateOrganizationCommand) {
    Object.assign(this, params);
  }
}
