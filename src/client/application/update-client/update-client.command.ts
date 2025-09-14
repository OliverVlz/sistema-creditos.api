export class UpdateClientCommand {
  readonly id: string;
  readonly organizationId?: string;
  readonly isActive?: boolean;

  constructor(params: UpdateClientCommand) {
    Object.assign(this, params);
  }
}
