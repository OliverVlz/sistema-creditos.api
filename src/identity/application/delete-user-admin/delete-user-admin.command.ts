export class DeleteUserAdminCommand {
  readonly userId: string;

  constructor(params: DeleteUserAdminCommand) {
    Object.assign(this, params);
  }
}
