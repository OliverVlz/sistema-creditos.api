import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateClientCommand } from './update-client.command';
import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { NotFoundException } from '@nestjs/common';
import { Client } from '../../infrastructure/entity/client.entity';

@CommandHandler(UpdateClientCommand)
export class UpdateClientHandler
  implements ICommandHandler<UpdateClientCommand>
{
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(command: UpdateClientCommand) {
    const existingClient = await this.clientRepository.findOneByUserId(
      command.userId,
    );
    if (!existingClient) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const { userId, ...updateData } = command;

    return this.clientRepository.update(existingClient.id, updateData);
  }
}
