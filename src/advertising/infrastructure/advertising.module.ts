import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Advertisement } from './entity/advertisement.entity';
import { AdvertisingController } from './advertising.controller';
import { AdvertisementRepository } from './repositories/advertisement.repository';
import { CreateAdvertisementHandler } from '../application/create-advertisement/create-advertisement.handler';
import { UpdateAdvertisementHandler } from '../application/update-advertisement/update-advertisement.handler';
import { SetAdvertisementStatusHandler } from '../application/set-advertisement-status/set-advertisement-status.handler';
import { ReorderAdvertisementsHandler } from '../application/reorder-advertisements/reorder-advertisements.handler';
import { DeleteAdvertisementHandler } from '../application/delete-advertisement/delete-advertisement.handler';
import { GetAdvertisementsHandler } from '../application/get-advertisements/get-advertisements.handler';
import { GetPublicAdvertisementsHandler } from '../application/get-public-advertisements/get-public-advertisements.handler';

const CommandHandlers = [
  CreateAdvertisementHandler,
  UpdateAdvertisementHandler,
  SetAdvertisementStatusHandler,
  ReorderAdvertisementsHandler,
  DeleteAdvertisementHandler,
];

const QueryHandlers = [GetAdvertisementsHandler, GetPublicAdvertisementsHandler];

const Repositories = [AdvertisementRepository];

@Module({
  imports: [TypeOrmModule.forFeature([Advertisement]), CqrsModule],
  controllers: [AdvertisingController],
  providers: [...Repositories, ...CommandHandlers, ...QueryHandlers],
})
export class AdvertisingModule {}
