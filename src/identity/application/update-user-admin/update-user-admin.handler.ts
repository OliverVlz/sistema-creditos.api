import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserAdminCommand } from './update-user-admin.command';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { User } from 'src/identity/infrastructure/entity/user.entity';

@CommandHandler(UpdateUserAdminCommand)
export class UpdateUserAdminHandler
  implements ICommandHandler<UpdateUserAdminCommand, User>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdateUserAdminCommand): Promise<User> {
    const { userId, ...restCommand } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    if (restCommand.email && restCommand.email !== user.email) {
      const existingUserWithEmail = await this.userRepository.findByEmail(
        restCommand.email,
      );
      if (existingUserWithEmail) {
        throw new BadRequestException(
          `El email ${restCommand.email} ya está en uso por otro usuario`,
        );
      }
    }

    // Si se actualiza el documento, verificar que no esté en uso
    if (
      restCommand.documentNumber &&
      restCommand.documentNumber !== user.documentNumber
    ) {
      const existingUserWithDoc =
        await this.userRepository.findByDocumentNumber(
          restCommand.documentNumber,
        );
      if (existingUserWithDoc) {
        throw new BadRequestException(
          `El número de documento ${restCommand.documentNumber} ya está en uso por otro usuario`,
        );
      }
    }

    const updateData = await this.formatUpdateData(restCommand);

    if (Object.keys(updateData).length > 0) {
      const updatedUser = await this.userRepository.update(userId, updateData);
      return updatedUser;
    }
    return user;
  }

  private async formatUpdateData(data: Omit<UpdateUserAdminCommand, 'userId'>) {
    return { ...data };
  }
}
