import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DomainError } from 'src/shared/domain';
import { HashService } from 'src/shared/hash';

import { User } from 'src/identity/domain/user.model';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';

import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly hashService: HashService,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: CreateUserCommand) {
    const formattedUser = await this.formatUser(command);

    try {
      const user = await this.userRepository.create(formattedUser);
      return User.fromModel(user);
    } catch (e) {
      if (e.code === 11000) {
        throw new DomainError(
          'USER_ALREADY_REGISTERED',
          'User already exists.',
        );
      } else {
        throw e;
      }
    }
  }

  private async formatUser(data: CreateUserCommand) {
    return {
      email: data.email,
      password: await this.hashService.hash(data.password),
      profile: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
    };
  }
}
