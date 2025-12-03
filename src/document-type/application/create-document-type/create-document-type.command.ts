export class CreateDocumentTypeCommand {
  readonly name: string;

  constructor(params: CreateDocumentTypeCommand) {
    Object.assign(this, params);
  }
}
