export class GetClientByIdQuery {
  readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }
}
