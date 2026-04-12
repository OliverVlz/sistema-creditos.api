import { BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { StorageService } from 'src/storage/infrastructure/storage.service';
import { AdvertisementRepository } from '../../infrastructure/repositories/advertisement.repository';
import { CreateAdvertisementCommand } from './create-advertisement.command';

@CommandHandler(CreateAdvertisementCommand)
export class CreateAdvertisementHandler
  implements ICommandHandler<CreateAdvertisementCommand>
{
  constructor(
    private readonly advertisementRepository: AdvertisementRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(command: CreateAdvertisementCommand) {
    if (!command.image) {
      throw new BadRequestException('Debe enviar una imagen');
    }

    const uploadResult = await this.storageService.uploadFile(
      command.image,
      'advertisements',
      this.storageService.getPublicBucketName(),
    );

    const advertisement =
      await this.advertisementRepository.createAdvertisement({
        title: command.title,
        imageUrl: uploadResult.url,
        imageKey: uploadResult.key,
        targetUrl: command.targetUrl,
        isRedirectEnabled: command.isRedirectEnabled,
        isActive: command.isActive,
        sortOrder: command.sortOrder,
        startsAt: command.startsAt,
        endsAt: command.endsAt,
        createdBy: command.createdBy,
      });

    return advertisement;
  }
}
