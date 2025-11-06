export class GetUsersClientInfoByIdQuery {
  readonly id: string;
  readonly isClientId: boolean;

  constructor(id: string, isClientId: boolean = false) {
    this.id = id;
    this.isClientId = isClientId;
  }
}
