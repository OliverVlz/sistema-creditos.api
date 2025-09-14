export class GetLoanTypesQuery {
  readonly terms?: string;
  readonly isActive?: boolean;
  readonly page?: number;
  readonly limit?: number;

  constructor(params: GetLoanTypesQuery) {
    Object.assign(this, params);
  }
}



