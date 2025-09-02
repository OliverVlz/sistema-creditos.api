export class EditPasswordCommand {
  constructor(
    readonly userId: string,
    readonly newPassword: string,
  ) {}
}
