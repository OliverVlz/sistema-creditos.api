import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AdvertisementRepository } from '../../infrastructure/repositories/advertisement.repository';
import { RecycleAdvertisementCommand } from './recycle-advertisement.command';

@CommandHandler(RecycleAdvertisementCommand)
export class RecycleAdvertisementHandler
  implements ICommandHandler<RecycleAdvertisementCommand>
{
  constructor(
    private readonly advertisementRepository: AdvertisementRepository,
  ) {}

  async execute(command: RecycleAdvertisementCommand) {
    return this.advertisementRepository.recycleFromHistory(
      command.id,
      command.historyId,
      command.updatedBy,
    );
  }
}
