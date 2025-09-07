import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateClientCommand } from './update-client.command';
import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { NotFoundException } from '@nestjs/common';
import { Client } from '../../infrastructure/entity/client.entity';

@CommandHandler(UpdateClientCommand)
export class UpdateClientHandler implements ICommandHandler<UpdateClientCommand> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(command: UpdateClientCommand): Promise<Client> {
    const existingClient = await this.clientRepository.findOne(command.id);
    if (!existingClient) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const { id, ...updateData } = command;

    return this.clientRepository.update(id, updateData);
  }
}
