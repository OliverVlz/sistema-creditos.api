import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateClientProfileCommand } from './update-client-profile.command';
import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';

@CommandHandler(UpdateClientProfileCommand)
export class UpdateClientProfileHandler
  implements ICommandHandler<UpdateClientProfileCommand>
{
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: UpdateClientProfileCommand) {
    return await this.dataSource.transaction(async manager => {
      const clientRepo = manager.getRepository('clients');
      const userRepo = manager.getRepository(User);
      const orgRepo = manager.getRepository(Organization);

      // Buscar cliente por userId
      const client = await this.clientRepository.findOneByUserId(
        command.userId,
      );

      if (!client) {
        throw new NotFoundException('Cliente no encontrado');
      }

      // Validar organización si se proporciona
      if (command.organizationId) {
        const orgExists = await orgRepo.exists({
          where: { id: command.organizationId },
        });
        if (!orgExists) {
          throw new BadRequestException('Organización no encontrada');
        }
      }

      // Actualizar datos del cliente (tabla clients)
      const clientUpdateData: any = {};
      if (command.address !== undefined)
        clientUpdateData.address = command.address;
      if (command.employmentStatus !== undefined)
        clientUpdateData.employmentStatus = command.employmentStatus;
      if (command.birthDate !== undefined)
        clientUpdateData.birthDate = new Date(command.birthDate);
      if (command.organizationId !== undefined)
        clientUpdateData.organizationId = command.organizationId;

      if (Object.keys(clientUpdateData).length > 0) {
        await clientRepo.update(client.id, clientUpdateData);
      }

      // Actualizar datos del usuario (tabla users)
      const userUpdateData: any = {};
      if (command.phoneNumber !== undefined)
        userUpdateData.phoneNumber = command.phoneNumber;
      if (command.firstName !== undefined)
        userUpdateData.firstName = command.firstName;
      if (command.lastName !== undefined)
        userUpdateData.lastName = command.lastName;

      if (Object.keys(userUpdateData).length > 0) {
        await userRepo.update(client.user.id, userUpdateData);
      }

      // Retornar cliente actualizado
      return this.clientRepository.findOneByUserId(command.userId);
    });
  }
}
