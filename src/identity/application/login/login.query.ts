export class LoginQuery {
  readonly email: string;
  readonly password: string;

  constructor(params: LoginQuery) {
    Object.assign(this, params);
  }
}
