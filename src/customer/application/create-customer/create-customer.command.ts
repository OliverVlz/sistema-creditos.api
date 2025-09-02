export class CreateCustomerCommand {
  readonly fullName: string;
  readonly documentNumber: string;
  readonly phone?: string;
  readonly address?: string;

  constructor(params: CreateCustomerCommand) {
    Object.assign(this, params);
  }
} 