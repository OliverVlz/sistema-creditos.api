import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AdvertisementRepository } from '../../infrastructure/repositories/advertisement.repository';
import { ReorderAdvertisementsCommand } from './reorder-advertisements.command';

@CommandHandler(ReorderAdvertisementsCommand)
export class ReorderAdvertisementsHandler
  implements ICommandHandler<ReorderAdvertisementsCommand>
{
  constructor(
    private readonly advertisementRepository: AdvertisementRepository,
  ) {}

  async execute(command: ReorderAdvertisementsCommand) {
    await this.advertisementRepository.reorderAdvertisements(
      command.items,
      command.updatedBy,
    );
    return { success: true };
  }
}
