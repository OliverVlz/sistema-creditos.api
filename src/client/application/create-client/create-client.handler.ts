import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HashService } from 'src/shared/hash';
import { CreateClientCommand } from './create-client.command';
import { ClientRepository } from 'src/client/infrastructure/repositories/client.repository';

type CreateClientResult = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  phoneNumber: string | null;
  client: {
    id: string;
    address: string | null;
    birthDate: string | null;
    employmentStatus: string | null;
    isActive: boolean;
    organization: { id: string; name: string };
  };
};

@CommandHandler(CreateClientCommand)
export class CreateClientHandler
  implements ICommandHandler<CreateClientCommand, CreateClientResult>
{
  constructor(
    private readonly hashService: HashService,
    private readonly clientRepository: ClientRepository,
  ) {}

  async execute(command: CreateClientCommand): Promise<CreateClientResult> {
    const hashedPassword = await this.hashService.hash(command.password);

    return await this.clientRepository.createUserWithClient({
      email: command.email,
      password: hashedPassword,
      firstName: command.firstName,
      lastName: command.lastName,
      role: command.role,
      documentNumber: command.documentNumber,
      phoneNumber: command.phoneNumber,
      address: command.address,
      birthDate: command.birthDate,
      employmentStatus: command.employmentStatus,
      organizationId: command.organizationId,
      createdBy: command.createdBy,
    });
  }
}
