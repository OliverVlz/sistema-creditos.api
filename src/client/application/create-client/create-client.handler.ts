import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateClientCommand } from './create-client.command';
import { ClientRepository } from '../../infrastructure/repositories/client.repository';
import { HashService } from '../../../shared/hash';
import { DomainError } from 'src/shared/domain';
import { UserRole } from 'src/shared/enums';

@CommandHandler(CreateClientCommand)
export class CreateClientHandler
  implements ICommandHandler<CreateClientCommand>
{
  constructor(
    private readonly hashService: HashService,
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: CreateClientCommand) {
    const formattedClientData = await this.formatClientData(command);

    try {
      const userWithClient =
        await this.clientRepository.createUserWithClient(formattedClientData);
      return userWithClient;
    } catch (e) {
      if (e.code === '23505' || e.code === 'ER_DUP_ENTRY') {
        throw new DomainError(
          'USER_ALREADY_REGISTERED',
          'User already exists or document number is duplicated.',
        );
      } else {
        throw e;
      }
    }
  }

  private async formatClientData(command: CreateClientCommand) {
    return {
      ...command,
      role: UserRole.CLIENTE,
      password: await this.hashService.hash(command.password),
    };
  }
}
