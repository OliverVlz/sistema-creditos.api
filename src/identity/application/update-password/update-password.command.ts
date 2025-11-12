export class UpdatePasswordCommand {
  readonly userId: string;
  readonly currentPassword: string;
  readonly newPassword: string;

  constructor(params: UpdatePasswordCommand) {
    Object.assign(this, params);
  }
}
