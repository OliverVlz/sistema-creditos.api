import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateClientAdminCommand } from './update-client-admin.command';
import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';

@CommandHandler(UpdateClientAdminCommand)
export class UpdateClientAdminHandler
  implements ICommandHandler<UpdateClientAdminCommand>
{
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: UpdateClientAdminCommand) {
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

      // Validar email único si se proporciona
      if (command.email && command.email !== client.user.email) {
        const emailExists = await userRepo.exists({
          where: { email: command.email },
        });
        if (emailExists) {
          throw new BadRequestException(
            'El email ya está registrado por otro usuario',
          );
        }
      }

      // Actualizar datos del cliente (tabla clients)
      const clientUpdateData: any = {
        updater: { id: command.updatedBy },
      };

      if (command.isActive !== undefined)
        clientUpdateData.isActive = command.isActive;
      if (command.employmentStatus !== undefined)
        clientUpdateData.employmentStatus = command.employmentStatus;
      if (command.address !== undefined)
        clientUpdateData.address = command.address;
      if (command.birthDate !== undefined)
        clientUpdateData.birthDate = new Date(command.birthDate);
      if (command.organizationId !== undefined)
        clientUpdateData.organizationId = command.organizationId;

      await clientRepo.update(client.id, clientUpdateData);

      // Actualizar datos del usuario (tabla users)
      const userUpdateData: any = {};
      if (command.phoneNumber !== undefined)
        userUpdateData.phoneNumber = command.phoneNumber;
      if (command.firstName !== undefined)
        userUpdateData.firstName = command.firstName;
      if (command.lastName !== undefined)
        userUpdateData.lastName = command.lastName;
      if (command.email !== undefined) userUpdateData.email = command.email;

      if (Object.keys(userUpdateData).length > 0) {
        await userRepo.update(client.user.id, userUpdateData);
      }

      // Retornar cliente actualizado
      return this.clientRepository.findOneByUserId(command.userId);
    });
  }
}
