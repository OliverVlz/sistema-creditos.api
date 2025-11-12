export class UpdatePasswordAdminCommand {
  readonly userId: string;
  readonly newPassword: string;

  constructor(params: UpdatePasswordAdminCommand) {
    Object.assign(this, params);
  }
}
