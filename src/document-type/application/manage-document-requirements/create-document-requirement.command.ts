export class CreateDocumentRequirementCommand {
  readonly loanTypeId: string;
  readonly documentTypeId: string;
  readonly organizationId?: string;
  readonly employmentStatus?: string;
  readonly isMandatory: boolean;
  readonly displayOrder: number;
  readonly validationRules?: object;
  readonly createdBy: string;

  constructor(params: CreateDocumentRequirementCommand) {
    Object.assign(this, params);
  }
}

