export class UpdateClientCommand {
  readonly id: number;
  readonly fullName?: string;
  readonly documentNumber?: string;
  readonly phone?: string;
  readonly address?: string;

  constructor(params: UpdateClientCommand) {
    Object.assign(this, params);
  }
}
