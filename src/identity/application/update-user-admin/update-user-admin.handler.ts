import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserAdminCommand } from './update-user-admin.command';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@CommandHandler(UpdateUserAdminCommand)
export class UpdateUserAdminHandler
  implements ICommandHandler<UpdateUserAdminCommand>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: UpdateUserAdminCommand): Promise<void> {
    const {
      userId,
      firstName,
      lastName,
      email,
      documentNumber,
      phoneNumber,
      role,
      isActive,
    } = command;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el usuario existe
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      // Si se actualiza el email, verificar que no esté en uso
      if (email && email !== user.email) {
        const existingUserWithEmail =
          await this.userRepository.findByEmail(email);
        if (existingUserWithEmail) {
          throw new BadRequestException(
            `El email ${email} ya está en uso por otro usuario`,
          );
        }
      }

      // Si se actualiza el documento, verificar que no esté en uso
      if (documentNumber && documentNumber !== user.documentNumber) {
        const existingUserWithDoc = await queryRunner.manager.findOne('users', {
          where: { documentNumber },
        });
        if (existingUserWithDoc) {
          throw new BadRequestException(
            `El número de documento ${documentNumber} ya está en uso por otro usuario`,
          );
        }
      }

      // Actualizar campos si se proporcionan
      const updateData: any = {};

      if (firstName !== undefined) {
        updateData.firstName = firstName;
      }
      if (lastName !== undefined) {
        updateData.lastName = lastName;
      }
      if (email !== undefined) {
        updateData.email = email;
      }
      if (documentNumber !== undefined) {
        updateData.documentNumber = documentNumber;
      }
      if (phoneNumber !== undefined) {
        updateData.phoneNumber = phoneNumber;
      }
      if (role !== undefined) {
        updateData.role = role;
      }
      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      // Solo actualizar si hay cambios
      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update('users', { id: userId }, updateData);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
