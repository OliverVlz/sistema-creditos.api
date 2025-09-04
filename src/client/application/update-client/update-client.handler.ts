import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateClientCommand } from './update-client.command';
import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Client } from '../../infrastructure/entity/client.entity';

@CommandHandler(UpdateClientCommand)
export class UpdateClientHandler implements ICommandHandler<UpdateClientCommand> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(command: UpdateClientCommand): Promise<Client> {
    const existingClient = await this.clientRepository.findOne(command.id);
    if (!existingClient) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (command.documentNumber && command.documentNumber !== existingClient.documentNumber) {
      const clientWithSameDocument = await this.clientRepository.findByDocumentNumber(command.documentNumber);
      if (clientWithSameDocument) {
        throw new ConflictException('Ya existe un cliente con ese número de documento');
      }
    }

    const clientData = {
      fullName: command.fullName,
      documentNumber: command.documentNumber,
      phone: command.phone,
      address: command.address,
    };

    const updatedClient = await this.clientRepository.update(command.id, clientData as Client);
    return updatedClient;
  }
}
