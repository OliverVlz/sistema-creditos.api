export class CreateLoanTypeCommand {
  readonly name: string;
  readonly description: string;
  readonly baseProcessingFee: number;
  readonly maxAmount: number;
  readonly minAmount: number;
  readonly maxTermMonths: number;
  readonly isActive: boolean;
  readonly requiredDocumentTypes?: string[];

  constructor(params: CreateLoanTypeCommand) {
    Object.assign(this, params);
  }
}



