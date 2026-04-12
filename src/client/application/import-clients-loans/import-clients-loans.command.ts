export class ImportClientsLoansCommand {
  readonly file: Express.Multer.File;
  readonly chunkSize: number;

  constructor(params: ImportClientsLoansCommand) {
    Object.assign(this, params);
  }
}
