export class GetClientsQuery {
  readonly terms?: string;
  readonly page?: number;
  readonly limit?: number;

  constructor(params: GetClientsQuery) {
    Object.assign(this, params);
  }
}
