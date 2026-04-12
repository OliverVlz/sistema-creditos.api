import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { StorageService } from 'src/storage/infrastructure/storage.service';
import { AdvertisementRepository } from '../../infrastructure/repositories/advertisement.repository';
import { DeleteAdvertisementCommand } from './delete-advertisement.command';

@CommandHandler(DeleteAdvertisementCommand)
export class DeleteAdvertisementHandler
  implements ICommandHandler<DeleteAdvertisementCommand>
{
  constructor(
    private readonly advertisementRepository: AdvertisementRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(command: DeleteAdvertisementCommand) {
    const advertisement = await this.advertisementRepository.findOne(command.id);
    await this.advertisementRepository.deleteAdvertisement(command.id);
    await this.storageService
      .deleteFile(advertisement.imageKey, this.storageService.getPublicBucketName())
      .catch(() => undefined);
    return { id: command.id };
  }
}
