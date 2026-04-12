import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Advertisement } from './entity/advertisement.entity';
import { AdvertisementHistory } from './entity/advertisement-history.entity';
import { AdvertisingController } from './advertising.controller';
import { AdvertisementRepository } from './repositories/advertisement.repository';
import { CreateAdvertisementHandler } from '../application/create-advertisement/create-advertisement.handler';
import { UpdateAdvertisementHandler } from '../application/update-advertisement/update-advertisement.handler';
import { SetAdvertisementStatusHandler } from '../application/set-advertisement-status/set-advertisement-status.handler';
import { ReorderAdvertisementsHandler } from '../application/reorder-advertisements/reorder-advertisements.handler';
import { RecycleAdvertisementHandler } from '../application/recycle-advertisement/recycle-advertisement.handler';
import { GetAdvertisementsHandler } from '../application/get-advertisements/get-advertisements.handler';
import { GetPublicAdvertisementsHandler } from '../application/get-public-advertisements/get-public-advertisements.handler';
import { GetAdvertisementHistoryHandler } from '../application/get-advertisement-history/get-advertisement-history.handler';

const CommandHandlers = [
  CreateAdvertisementHandler,
  UpdateAdvertisementHandler,
  SetAdvertisementStatusHandler,
  ReorderAdvertisementsHandler,
  RecycleAdvertisementHandler,
];

const QueryHandlers = [
  GetAdvertisementsHandler,
  GetPublicAdvertisementsHandler,
  GetAdvertisementHistoryHandler,
];

const Repositories = [AdvertisementRepository];

@Module({
  imports: [TypeOrmModule.forFeature([Advertisement, AdvertisementHistory]), CqrsModule],
  controllers: [AdvertisingController],
  providers: [...Repositories, ...CommandHandlers, ...QueryHandlers],
})
export class AdvertisingModule {}
