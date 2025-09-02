import { UserRole } from 'src/shared/enums';

export class GetUsersQuery {
  readonly role?: UserRole;

  constructor(params?: GetUsersQuery) {
    Object.assign(this, params);
  }
} 