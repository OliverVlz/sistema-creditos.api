import { LoanStatus } from '../../infrastructure/entity/loan.entity';

export class GetLoansQuery {
  readonly terms?: string;
  readonly page?: number;
  readonly limit?: number;
  readonly clientId?: string;
  readonly organizationId?: string;
  readonly status?: LoanStatus;
  readonly startDateFrom?: string;
  readonly startDateTo?: string;
  readonly createdDateFrom?: string;
  readonly createdDateTo?: string;

  constructor(params: GetLoansQuery) {
    Object.assign(this, params);
  }
}
