export class GetOrganizationsQuery {
  readonly terms?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly isActive?: boolean;

  constructor(params: GetOrganizationsQuery) {
    Object.assign(this, params);
  }
}
