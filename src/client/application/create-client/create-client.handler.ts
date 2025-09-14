import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QueryFailedError } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DomainError } from 'src/shared/domain';
import { User } from 'src/identity/infrastructure/entity/user.entity';

import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { CreateClientCommand } from './create-client.command';

@CommandHandler(CreateClientCommand)
export class CreateClientHandler implements ICommandHandler<CreateClientCommand> {
  constructor(
    private readonly clientRepository: ClientRepository,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(command: CreateClientCommand) {
    try {
      // Verificar que el usuario existe
      const user = await this.userRepository.findOne({ 
        where: { id: command.userId } 
      });
      
      if (!user) {
        throw new DomainError(
          'USER_NOT_FOUND',
          'User not found.',
        );
      }

      // Verificar que no existe ya un cliente para este usuario
      const existingClient = await this.clientRepository.findOne(command.userId);
      if (existingClient) {
        throw new DomainError(
          'CLIENT_ALREADY_EXISTS',
          'Client record already exists for this user.',
        );
      }

      // Crear el registro de cliente
      return await this.clientRepository.create(command);
      
    } catch (error) {
      if (error instanceof QueryFailedError) {
        // Código de error de clave duplicada para PostgreSQL es '23505'
        if (error.driverError && error.driverError.code === '23505') {
          throw new DomainError(
            'CLIENT_ALREADY_EXISTS',
            'Client record already exists for this user.',
          );
        }
      }
      throw error;
    }
  }
}
