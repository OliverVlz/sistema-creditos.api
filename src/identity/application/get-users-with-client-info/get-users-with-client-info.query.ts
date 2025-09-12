export class GetUsersWithClientInfoQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly terms?: string;

  constructor(params: GetUsersWithClientInfoQuery) {
    Object.assign(this, params);
  }
}
