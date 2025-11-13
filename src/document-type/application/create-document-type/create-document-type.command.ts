export class CreateDocumentTypeCommand {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly mimeTypes?: string[];
  readonly maxFileSize?: number;
  readonly validationRules?: object;
  readonly isActive?: boolean;
  readonly displayOrder?: number;

  constructor(params: CreateDocumentTypeCommand) {
    Object.assign(this, params);
  }
}
