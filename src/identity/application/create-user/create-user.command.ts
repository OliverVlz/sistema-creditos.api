import { UserRole, Language } from 'src/shared/enums';

export class CreateUserCommand {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;
  readonly documentNumber?: string;
  readonly phone?: string;
  readonly role?: UserRole;
  readonly language?: Language;

  constructor(params: CreateUserCommand) {
    Object.assign(this, params);
  }
}
