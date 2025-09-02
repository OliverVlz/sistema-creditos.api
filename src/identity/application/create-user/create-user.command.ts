export class CreateUserCommand {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;

  constructor(params: CreateUserCommand) {
    Object.assign(this, params);
  }
}
