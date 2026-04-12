import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { StorageService } from 'src/storage/infrastructure/storage.service';
import { AdvertisementRepository } from '../../infrastructure/repositories/advertisement.repository';
import { UpdateAdvertisementCommand } from './update-advertisement.command';

@CommandHandler(UpdateAdvertisementCommand)
export class UpdateAdvertisementHandler
  implements ICommandHandler<UpdateAdvertisementCommand>
{
  constructor(
    private readonly advertisementRepository: AdvertisementRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(command: UpdateAdvertisementCommand) {
    const existingAdvertisement = await this.advertisementRepository.findOne(
      command.id,
    );

    let imageUrl = existingAdvertisement.imageUrl;
    let imageKey = existingAdvertisement.imageKey;
    let oldImageKey = '';

    if (command.image) {
      const uploadResult = await this.storageService.uploadFile(
        command.image,
        'advertisements',
        this.storageService.getPublicBucketName(),
      );
      imageUrl = uploadResult.url;
      imageKey = uploadResult.key;
      oldImageKey = existingAdvertisement.imageKey;
    }

    const updated = await this.advertisementRepository.updateAdvertisement(
      command.id,
      {
        title: command.title,
        targetUrl: command.targetUrl,
        isRedirectEnabled: command.isRedirectEnabled,
        isActive: command.isActive,
        sortOrder: command.sortOrder,
        startsAt: command.startsAt,
        endsAt: command.endsAt,
        imageUrl,
        imageKey,
        updatedBy: command.updatedBy,
      },
    );

    if (oldImageKey) {
      const oldBucket = this.storageService.extractBucketFromUrl(
        existingAdvertisement.imageUrl,
      );
      await this.storageService.deleteFile(oldImageKey, oldBucket);
    }

    return updated;
  }
}
