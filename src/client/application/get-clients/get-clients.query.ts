export class GetClientsQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly terms?: string;
  readonly organizationId?: string;

  constructor(params: GetClientsQuery) {
    Object.assign(this, params);
  }
}
