import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AdvertisementRepository } from '../../infrastructure/repositories/advertisement.repository';
import { GetPublicAdvertisementsQuery } from './get-public-advertisements.query';

@QueryHandler(GetPublicAdvertisementsQuery)
export class GetPublicAdvertisementsHandler
  implements IQueryHandler<GetPublicAdvertisementsQuery>
{
  constructor(
    private readonly advertisementRepository: AdvertisementRepository,
  ) {}

  async execute(query: GetPublicAdvertisementsQuery) {
    return this.advertisementRepository.getPublicActiveAdvertisements(query.limit);
  }
}
