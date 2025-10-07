export class GetUsersClientInfoQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly terms?: string;

  constructor(params: GetUsersClientInfoQuery) {
    Object.assign(this, params);
  }
}
