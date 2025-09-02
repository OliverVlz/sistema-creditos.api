export class GetCustomersQuery {
  readonly terms?: string;
  readonly cursor?: string;
  readonly size?: number;

  constructor(params: GetCustomersQuery) {
    Object.assign(this, params);
  }
} 