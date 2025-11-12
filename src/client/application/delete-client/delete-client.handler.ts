import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';

import { ClientRepository } from '../../infrastructure/repositories/client.repository';

import { DeleteClientCommand } from './delete-client.command';

@CommandHandler(DeleteClientCommand)
export class DeleteClientHandler
  implements ICommandHandler<DeleteClientCommand>
{
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(command: DeleteClientCommand) {
    const existingClient = await this.clientRepository.findOneByUserId(
      command.userId,
    );
    if (!existingClient) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return this.clientRepository.remove(existingClient.id);
  }
}
