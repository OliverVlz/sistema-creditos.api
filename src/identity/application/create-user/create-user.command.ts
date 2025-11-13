import { UserRole } from 'src/shared/enums';

export class CreateUserCommand {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;
  readonly documentNumber: string;
  readonly phoneNumber?: string;
  readonly role?: UserRole;

  constructor(params: CreateUserCommand) {
    Object.assign(this, params);
  }
}
