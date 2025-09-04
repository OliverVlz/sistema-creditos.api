export class CreateClientCommand {
  readonly fullName: string;
  readonly documentNumber: string;
  readonly phone?: string;
  readonly address?: string;

  constructor(params: CreateClientCommand) {
    Object.assign(this, params);
  }
}
