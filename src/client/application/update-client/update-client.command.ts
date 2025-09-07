export class UpdateClientCommand {
  readonly id: string;
  readonly creditScore?: number;
  readonly maxCreditLimit?: number;
  readonly riskLevel?: string;

  constructor(params: UpdateClientCommand) {
    Object.assign(this, params);
  }
}
