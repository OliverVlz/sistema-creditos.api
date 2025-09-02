export class UpdateCustomerCommand {
  readonly id: number;
  readonly fullName?: string;
  readonly documentNumber?: string;
  readonly phone?: string;
  readonly address?: string;

  constructor(params: UpdateCustomerCommand) {
    Object.assign(this, params);
  }
} 