export class UpdateClientCommand {
  readonly userId: string;
  readonly organizationId?: string;
  readonly isActive?: boolean;

  constructor(params: UpdateClientCommand) {
    Object.assign(this, params);
  }
}
