import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserProfileCommand } from './update-user-profile.command';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileHandler
  implements ICommandHandler<UpdateUserProfileCommand>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: UpdateUserProfileCommand): Promise<void> {
    const { userId, firstName, lastName, phoneNumber } = command;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el usuario existe
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      // Actualizar campos si se proporcionan
      const updateData: any = {};

      if (firstName !== undefined) {
        updateData.firstName = firstName;
      }
      if (lastName !== undefined) {
        updateData.lastName = lastName;
      }
      if (phoneNumber !== undefined) {
        updateData.phoneNumber = phoneNumber;
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
