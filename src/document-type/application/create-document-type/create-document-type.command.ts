export class CreateDocumentTypeCommand {
  readonly code: string;
  readonly name: string;

  constructor(params: CreateDocumentTypeCommand) {
    Object.assign(this, params);
  }
}
