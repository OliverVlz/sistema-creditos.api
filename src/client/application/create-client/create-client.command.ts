export class CreateClientCommand {
  readonly firstName: string;
  readonly lastName: string;
  readonly documentNumber: string;
  readonly phone?: string;
  readonly email?: string;
  readonly address?: string;
  readonly organizationId: string;
  readonly createdBy: string;

  constructor(params: CreateClientCommand) {
    Object.assign(this, params);
  }
}
