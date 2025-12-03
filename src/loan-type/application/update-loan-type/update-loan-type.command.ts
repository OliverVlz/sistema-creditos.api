export class UpdateLoanTypeCommand {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly interestRate?: number;
  readonly minAmount?: number;
  readonly maxAmount?: number;
  readonly minTerm?: number;
  readonly maxTerm?: number;
  readonly isActive?: boolean;
  readonly requiredDocumentTypeIds?: string[];

  constructor(params: UpdateLoanTypeCommand) {
    Object.assign(this, params);
  }
}
