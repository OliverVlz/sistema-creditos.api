export class UpdateLoanTypeCommand {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly baseProcessingFee?: number;
  readonly maxAmount?: number;
  readonly minAmount?: number;
  readonly maxTermMonths?: number;
  readonly isActive?: boolean;
  readonly requiredDocumentTypes?: string[];
  readonly updatedAt?: Date;
  readonly updatedBy?: string;

  constructor(params: UpdateLoanTypeCommand) {
    Object.assign(this, params);
  }
}



