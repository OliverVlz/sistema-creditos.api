export type ImportedClientsLoansFile = {
  buffer: Buffer;
  originalname: string;
};

export class ImportClientsLoansCommand {
  readonly file: ImportedClientsLoansFile;
  readonly chunkSize: number;

  constructor(params: ImportClientsLoansCommand) {
    Object.assign(this, params);
  }
}
