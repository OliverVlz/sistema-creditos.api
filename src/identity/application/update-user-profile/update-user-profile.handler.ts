import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserProfileCommand } from './update-user-profile.command';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { NotFoundException } from '@nestjs/common';
import { User } from 'src/identity/infrastructure/entity/user.entity';

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileHandler
  implements ICommandHandler<UpdateUserProfileCommand, User>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: UpdateUserProfileCommand): Promise<User> {
    const { userId, ...restCommand } = command;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const updateData = await this.formatUpdateData(restCommand);

    if (Object.keys(updateData).length > 0) {
      const updatedUser = await this.userRepository.update(userId, updateData);
      return updatedUser;
    }
    return user;
  }

  private async formatUpdateData(
    data: Omit<UpdateUserProfileCommand, 'userId'>,
  ) {
    return { ...data };
  }
}
