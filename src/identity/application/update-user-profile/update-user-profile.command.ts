export class UpdateUserProfileCommand {
  readonly userId: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phoneNumber?: string;
  
  constructor(params: UpdateUserProfileCommand) {
    Object.assign(this, params);
  }
}
