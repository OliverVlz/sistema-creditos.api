export class DeleteDocumentTypeCommand {
  readonly id: string;
  readonly deletedBy: string;

  constructor(id: string, deletedBy: string) {
    this.id = id;
    this.deletedBy = deletedBy;
  }
}
