import { EmploymentStatus } from 'src/shared/enums';

export class GetClientsQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly terms?: string;
  readonly organizationId?: string;
  readonly employmentStatus?: EmploymentStatus;
  readonly isActive?: boolean;
  readonly uploadedByExcel?: boolean;

  constructor(params: GetClientsQuery) {
    Object.assign(this, params);
  }
}
