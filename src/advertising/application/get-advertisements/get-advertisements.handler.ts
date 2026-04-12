import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AdvertisementRepository } from '../../infrastructure/repositories/advertisement.repository';
import { GetAdvertisementsQuery } from './get-advertisements.query';

@QueryHandler(GetAdvertisementsQuery)
export class GetAdvertisementsHandler
  implements IQueryHandler<GetAdvertisementsQuery>
{
  constructor(
    private readonly advertisementRepository: AdvertisementRepository,
  ) {}

  async execute(query: GetAdvertisementsQuery) {
    return this.advertisementRepository.searchWithPagination(query);
  }
}
