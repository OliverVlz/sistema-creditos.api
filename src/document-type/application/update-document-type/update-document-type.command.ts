export class UpdateDocumentTypeCommand {
  readonly id: string;
  readonly code?: string;
  readonly name?: string;
  readonly isActive?: boolean;

  constructor(params: UpdateDocumentTypeCommand) {
    Object.assign(this, params);
  }
}
