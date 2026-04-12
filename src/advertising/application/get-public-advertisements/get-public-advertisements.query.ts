export class GetPublicAdvertisementsQuery {
  public readonly limit: number;

  constructor(limit: number = 20) {
    this.limit = limit;
  }
}
