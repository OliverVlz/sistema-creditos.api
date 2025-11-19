import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateClientAdminCommand } from './update-client-admin.command';
import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { Client } from '../../infrastructure/entity/client.entity';
import { User as UserDomainModel } from 'src/identity/domain/user.model';

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
      const clientRepo = manager.getRepository(Client);
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
      if (command.employmentStatus !== undefined)
        client.employmentStatus = command.employmentStatus;
      if (command.address !== undefined) client.address = command.address;
      if (command.birthDate !== undefined)
        client.birthDate = new Date(command.birthDate);
      if (command.organizationId !== undefined) {
        client.organization = await orgRepo.findOne({
          where: { id: command.organizationId },
        });
      }

      await clientRepo.save(client);

      // Actualizar datos del usuario (tabla users)
      const userUpdateData: any = {};
      if (command.phoneNumber !== undefined)
        userUpdateData.phoneNumber = command.phoneNumber;
      if (command.firstName !== undefined)
        userUpdateData.firstName = command.firstName;
      if (command.lastName !== undefined)
        userUpdateData.lastName = command.lastName;
      if (command.email !== undefined) userUpdateData.email = command.email;
      if (command.isActive !== undefined)
        userUpdateData.isActive = command.isActive;
      if (command.updater) {
        userUpdateData.updater = await userRepo.findOne({
          where: { id: command.updater },
        });
      }

      if (Object.keys(userUpdateData).length > 0) {
        await userRepo.save({ ...client.user, ...userUpdateData });
      }

      // Obtener datos actualizados
      const updatedClient = await this.clientRepository.findOneByUserId(
        command.userId,
        manager,
      );

      if (!updatedClient) {
        throw new NotFoundException(
          'Cliente no encontrado después de la actualización',
        );
      }

      // Retornar respuesta estructurada
      const userInfo = UserDomainModel.fromModel(
        updatedClient.user,
      ).getUserInfo();

      return {
        ...userInfo,
        clientInfo: {
          id: updatedClient.id,
          employmentStatus: updatedClient.employmentStatus,
          address: updatedClient.address,
          birthDate: updatedClient.birthDate
            ? updatedClient.birthDate instanceof Date
              ? updatedClient.birthDate.toISOString().split('T')[0]
              : String(updatedClient.birthDate).split('T')[0]
            : null,
          createdAt: updatedClient.createdAt,
          updatedAt: updatedClient.updatedAt,
          organization: updatedClient.organization
            ? {
                id: updatedClient.organization.id,
                name: updatedClient.organization.name,
                baseInterestRate: updatedClient.organization.baseInterestRate,
                discountRate: updatedClient.organization.discountRate,
                taxRate: updatedClient.organization.taxRate,
                isActive: updatedClient.organization.isActive,
                createdAt: updatedClient.organization.createdAt,
                updatedAt: updatedClient.organization.updatedAt,
              }
            : null,
          updater: updatedClient.user.updater
            ? UserDomainModel.fromModel(
                updatedClient.user.updater,
              ).getUserInfo()
            : null,
        },
      };
    });
  }
}
