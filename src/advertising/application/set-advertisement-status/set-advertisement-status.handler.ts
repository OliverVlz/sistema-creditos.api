import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AdvertisementRepository } from '../../infrastructure/repositories/advertisement.repository';
import { SetAdvertisementStatusCommand } from './set-advertisement-status.command';

@CommandHandler(SetAdvertisementStatusCommand)
export class SetAdvertisementStatusHandler
  implements ICommandHandler<SetAdvertisementStatusCommand>
{
  constructor(
    private readonly advertisementRepository: AdvertisementRepository,
  ) {}

  async execute(command: SetAdvertisementStatusCommand) {
    return this.advertisementRepository.setAdvertisementStatus(
      command.id,
      command.isActive,
      command.updatedBy,
    );
  }
}
