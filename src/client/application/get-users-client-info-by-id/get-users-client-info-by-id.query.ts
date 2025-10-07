export class GetUsersClientInfoByIdQuery {
  readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }
}
