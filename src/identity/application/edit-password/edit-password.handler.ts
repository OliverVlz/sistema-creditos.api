import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { HashService } from 'src/shared/hash';

import { UserRepository } from '../../infrastructure/repositories/user.repository';

import { EditPasswordCommand } from './edit-password.command';

@CommandHandler(EditPasswordCommand)
export class EditPasswordHandler
  implements ICommandHandler<EditPasswordCommand>
{
  constructor(
    private readonly hashService: HashService,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: EditPasswordCommand) {
    return this.userRepository.update(command.userId, {
      password: await this.hashService.hash(command.newPassword),
    });
  }
}
