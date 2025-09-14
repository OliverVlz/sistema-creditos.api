export class UpdateDocumentTypeCommand {
  readonly id: string;
  readonly code?: string;
  readonly name?: string;
  readonly description?: string;
  readonly mimeTypes?: string[];
  readonly maxFileSize?: number;
  readonly validationRules?: object;
  readonly isActive?: boolean;
  readonly displayOrder?: number;
  readonly updatedBy?: string;

  constructor(params: UpdateDocumentTypeCommand) {
    Object.assign(this, params);
  }
}
