import { GetAdvertisementsDto } from '../../infrastructure/dto/get-advertisements.dto';

export class GetAdvertisementsQuery {
  public readonly terms?: string;
  public readonly page?: number;
  public readonly limit?: number;
  public readonly isActive?: boolean;

  constructor(payload: GetAdvertisementsDto) {
    this.terms = payload.terms;
    this.page = payload.page;
    this.limit = payload.limit;
    this.isActive = payload.isActive;
  }
}
