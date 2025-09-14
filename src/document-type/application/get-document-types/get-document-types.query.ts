export class GetDocumentTypesQuery {
  readonly terms?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly isActive?: boolean;

  constructor(params: GetDocumentTypesQuery) {
    Object.assign(this, params);
  }
}
