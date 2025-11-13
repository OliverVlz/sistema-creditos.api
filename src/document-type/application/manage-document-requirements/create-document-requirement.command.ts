import { EmploymentStatus } from 'src/shared/enums'; // Importar EmploymentStatus

export class CreateDocumentRequirementCommand {
  readonly loanTypeId: string;
  readonly documentTypeId: string;
  readonly organizationId?: string;
  readonly employmentStatus?: EmploymentStatus; // Corregido a EmploymentStatus enum
  readonly isMandatory: boolean;
  readonly displayOrder: number;
  readonly validationRules?: object;

  constructor(params: CreateDocumentRequirementCommand) {
    Object.assign(this, params);
  }
}

