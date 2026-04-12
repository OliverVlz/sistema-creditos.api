import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AdvertisementRepository } from '../../infrastructure/repositories/advertisement.repository';
import { GetAdvertisementHistoryQuery } from './get-advertisement-history.query';

@QueryHandler(GetAdvertisementHistoryQuery)
export class GetAdvertisementHistoryHandler
  implements IQueryHandler<GetAdvertisementHistoryQuery>
{
  constructor(
    private readonly advertisementRepository: AdvertisementRepository,
  ) {}

  async execute(query: GetAdvertisementHistoryQuery) {
    await this.advertisementRepository.findOne(query.id);
    return this.advertisementRepository.getHistory(query.id);
  }
}
