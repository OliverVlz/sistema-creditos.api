export class GetUsersClientInfoQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly terms?: string;
  readonly organizationId?: string;

  constructor(params: GetUsersClientInfoQuery) {
    Object.assign(this, params);
  }
}
