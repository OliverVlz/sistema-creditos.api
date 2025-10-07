import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { HashService } from 'src/shared/hash';
import { CreateUserClientCommand } from './create-user-client.command';
import { DomainError } from 'src/shared/domain';

type CreateUserClientResult = {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  client: {
    id: string;
    address: string | null;
    birthDate: string | null;
    phoneNumber: string | null;
    employmentStatus: string | null;
    isActive: boolean;
    organization: { id: string; name: string };
  };
};

@CommandHandler(CreateUserClientCommand)
export class CreateUserClientHandler implements ICommandHandler<CreateUserClientCommand, CreateUserClientResult> {
  constructor(
    private readonly hashService: HashService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(command: CreateUserClientCommand): Promise<CreateUserClientResult> {
    const { email, password, firstName, lastName, documentNumber, phone, address, birthDate, employmentStatus, organizationId, role } = command;

    try {
      return await this.dataSource.transaction(async (manager) => {
        const [userRepo, clientRepo, orgRepo] = [
          manager.getRepository(User),
          manager.getRepository(Client),
          manager.getRepository(Organization)
        ];

        // Validaciones en paralelo
        const [existingUser, docExists, organization] = await Promise.all([
          userRepo.findOne({ where: { email }, select: ['id', 'email'] }),
          clientRepo.exists({ where: { documentNumber } }),
          orgRepo.findOne({ where: { id: organizationId }, select: ['id', 'name'] })
        ]);

        // Verificar usuario existente con cliente
        if (existingUser) {
          const hasClient = await clientRepo.exists({ where: { user: { id: existingUser.id } } });
          if (hasClient) {
            throw new DomainError('USER_ALREADY_EXISTS', 'User with this email already exists and has an associated client.');
          }
        }

        if (docExists) {
          throw new DomainError('CLIENT_DOCUMENT_NUMBER_ALREADY_EXISTS', 'Client with this document number already exists.');
        }

        if (!organization) {
          throw new DomainError('ORGANIZATION_NOT_FOUND', 'Organization not found');
        }

        // Crear/usar usuario
        const user = existingUser ?? await userRepo.save(userRepo.create({
          email,
          password: await this.hashService.hash(password),
          role,
          firstName,
          lastName,
        }));

        // Crear cliente
        const client = await clientRepo.save(clientRepo.create({
          user,
          organization,
          address: address ?? null,
          birthDate: birthDate ? new Date(birthDate) : null,
          phoneNumber: phone ?? null,
          documentNumber,
          employmentStatus: employmentStatus ?? null,
          isActive: true,
          creator: user,
        }));

        // Retornar resultado directo
        return {
          id: user.id,
          email: user.email,
          role: String(user.role),
          firstName: user.firstName,
          lastName: user.lastName,
          client: {
            id: client.id,
            ...(client.address && { address: client.address }),
            ...(client.birthDate && { birthDate: client.birthDate.toISOString().split('T')[0] }),
            ...(client.phoneNumber && { phoneNumber: client.phoneNumber }),
            ...(client.employmentStatus && { employmentStatus: client.employmentStatus }),
            isActive: client.isActive,
            organization: {
              id: organization.id,
              name: organization.name,
            },
          },
        };
      });
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new DomainError('SIGNUP_FAILED', 'Failed to complete signup due to an unexpected error.');
    }
  }
}