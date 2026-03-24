type ResetPasswordCommandProps = {
  token: string;
  newPassword: string;
};

export class ResetPasswordCommand {
  readonly token: string;
  readonly newPassword: string;

  constructor({ token, newPassword }: ResetPasswordCommandProps) {
    this.token = token;
    this.newPassword = newPassword;
  }
}
