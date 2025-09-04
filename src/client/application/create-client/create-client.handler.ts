import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';

import { DomainError } from 'src/shared/domain';

import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { CreateClientCommand } from './create-client.command';

@CommandHandler(CreateClientCommand)
export class CreateClientHandler implements ICommandHandler<CreateClientCommand> {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(command: CreateClientCommand) {
    try {
      return await this.clientRepository.create(command);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        // Código de error de clave duplicada para MySQL es '1062'
        if (error.driverError && error.driverError.code === '1062') {
          throw new DomainError(
            'CLIENT_ALREADY_EXISTS',
            `Client with document number '${command.documentNumber}' already exists.`,
          );
        }
      }
      throw error;
    }
  }
}
