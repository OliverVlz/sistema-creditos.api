import { UserRole } from 'src/shared/enums';

export class GetUsersQuery {
  readonly role?: UserRole;
  readonly page?: number;
  readonly limit?: number;
  readonly terms?: string;
  readonly isActive?: boolean;

  constructor(params?: GetUsersQuery) {
    Object.assign(this, params);
  }
}
