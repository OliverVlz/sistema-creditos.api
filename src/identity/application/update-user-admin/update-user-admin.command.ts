import { UserRole } from 'src/shared/enums';

export class UpdateUserAdminCommand {
  constructor(
    public readonly userId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly email?: string,
    public readonly documentNumber?: string,
    public readonly phoneNumber?: string,
    public readonly role?: UserRole,
    public readonly isActive?: boolean,
  ) {}
}
