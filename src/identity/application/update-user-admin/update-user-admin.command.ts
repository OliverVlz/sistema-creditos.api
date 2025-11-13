import { UserRole } from 'src/shared/enums'
    
export class UpdateUserAdminCommand {
  readonly userId: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly documentNumber?: string;
  readonly phoneNumber?: string;
  readonly role?: UserRole;
  readonly isActive?: boolean;
  
  constructor(params: UpdateUserAdminCommand) {
    Object.assign(this, params);
  }
}
