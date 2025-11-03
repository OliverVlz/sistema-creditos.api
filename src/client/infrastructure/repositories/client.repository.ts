import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Client } from '../entity/client.entity';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { DomainError } from 'src/shared/domain';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';
import { EmploymentStatus, UserRole } from 'src/shared/enums';

type CreateClientData = {
  user: { id: string };
  organization: { id: string };
  creator: { id: string };
  documentNumber: string;
  phoneNumber?: string;
  address: string;
  birthDate: Date;
  employmentStatus: EmploymentStatus;
};

type CreateUserWithClientData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  documentNumber: string;
  phoneNumber?: string;
  address: string;
  birthDate: string;
  employmentStatus: EmploymentStatus;
  organizationId: string;
  createdBy?: string;
};

type UserWithClientResult = {
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

type UpdateClientData = Partial<{
  isActive?: boolean;
  employmentStatus?: EmploymentStatus;
  organization?: { id: string };
  updater?: { id: string };
  documentNumber?: string;
  phoneNumber?: string;
  address?: string;
  birthDate?: Date;
}>;

type ClientSearchData = {
  terms?: string;
  page?: number;
  limit?: number;
  employmentStatus?: EmploymentStatus;
  organizationId?: string;
  isActive?: boolean;
};

type ClientSelect = { [key in keyof Client]?: boolean };

@Injectable()
export class ClientRepository {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private readonly dataSource: DataSource,
  ) {}

  async createUserWithClient(
    data: CreateUserWithClientData,
  ): Promise<UserWithClientResult> {
    return await this.dataSource.transaction(async manager => {
      const userRepo = manager.getRepository(User);
      const clientRepo = manager.getRepository(Client);
      const orgRepo = manager.getRepository(Organization);

      const existingUser = await userRepo.findOne({
        where: { email: data.email },
        select: ['id', 'email'],
      });

      if (existingUser) {
        const hasClient = await clientRepo.exists({
          where: { user: { id: existingUser.id } },
        });
        if (hasClient) {
          throw new DomainError(
            'USER_ALREADY_EXISTS',
            'User with this email already exists and has an associated client.',
          );
        }
      }

      const docExists = await clientRepo.exists({
        where: { documentNumber: data.documentNumber },
      });

      if (docExists) {
        throw new DomainError(
          'CLIENT_DOCUMENT_NUMBER_ALREADY_EXISTS',
          'Client with this document number already exists.',
        );
      }

      const organization = await orgRepo.findOne({
        where: { id: data.organizationId },
        select: ['id', 'name'],
      });

      if (!organization) {
        throw new DomainError(
          'ORGANIZATION_NOT_FOUND',
          'Organization not found',
        );
      }

      const user =
        existingUser ??
        ((await userRepo.save(
          userRepo.create({
            email: data.email,
            password: data.password,
            role: data.role as UserRole,
            firstName: data.firstName,
            lastName: data.lastName,
            createdBy: data.createdBy,
          }),
        )) as User);

      const creatorUser = data.createdBy
        ? await userRepo.findOne({ where: { id: data.createdBy } })
        : user;

      const client = (await clientRepo.save(
        clientRepo.create({
          user,
          organization,
          address: data.address ?? null,
          birthDate: data.birthDate ? new Date(data.birthDate) : null,
          phoneNumber: data.phoneNumber ?? null,
          documentNumber: data.documentNumber,
          employmentStatus: data.employmentStatus ?? null,
          isActive: true,
          creator: creatorUser || user,
        }),
      )) as Client;

      return {
        id: user.id,
        email: user.email,
        role: String(user.role),
        firstName: user.firstName,
        lastName: user.lastName,
        client: {
          id: client.id,
          address: client.address,
          birthDate: client.birthDate?.toISOString().split('T')[0] ?? null,
          phoneNumber: client.phoneNumber,
          employmentStatus: client.employmentStatus,
          isActive: client.isActive,
          organization: {
            id: organization.id,
            name: organization.name,
          },
        },
      };
    });
  }

  async create(client: CreateClientData) {
    return this.clientsRepository.save(this.clientsRepository.create(client));
  }

  async findAll() {
    const clients = await this.clientsRepository.find({
      relations: ['organization', 'creator', 'updater', 'user'],
      order: { createdAt: 'DESC' },
    });
    return clients;
  }

  async findOne(id: string) {
    const client = await this.clientsRepository.findOne({
      where: { id },
      relations: ['organization', 'creator', 'updater', 'user'],
    });
    if (!client) {
      throw new DomainError('CLIENT_NOT_FOUND', 'Client not found');
    }
    return client;
  }

  async update(id: string, client: UpdateClientData) {
    await this.clientsRepository.update(id, client);
    return this.findOne(id);
  }

  async findOneByUserIdWithLoans(userId: string) {
    const client = await this.clientsRepository.findOne({
      where: { user: { id: userId } },
      relations: [
        'user',
        'organization',
        'creator',
        'updater',
        'loans',
        'loans.loanType',
        'loans.organization',
      ],
    });
    return client;
  }

  async remove(id: string) {
    const deleteResult = await this.clientsRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new DomainError('CLIENT_NOT_FOUND', 'Client not found');
    }
  }

  async findByUserDocumentNumber(documentNumber: string) {
    const client = await this.clientsRepository.findOne({
      where: {
        documentNumber, // Apuntar directamente a la propiedad de Client
      },
      relations: ['organization', 'user'],
    });
    return client;
  }

  async searchClientsWithPagination(searchData: ClientSearchData) {
    const queryBuilder = this.clientsRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.organization', 'organization')
      .leftJoinAndSelect('client.creator', 'creator')
      .leftJoinAndSelect('client.updater', 'updater')
      .leftJoinAndSelect('client.user', 'user'); // No unimos con profile aquí

    if (searchData.terms) {
      const term = searchData.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        // Buscar por firstName, lastName de User y documentNumber de Client
        `(LOWER(user.firstName) LIKE :term OR LOWER(user.lastName) LIKE :term OR LOWER(client.documentNumber) LIKE :term OR LOWER(user.email) LIKE :term)`,
        { term: `%${term}%` },
      );
    }

    if (searchData.organizationId) {
      queryBuilder.andWhere('client.organizationId = :organizationId', {
        organizationId: searchData.organizationId,
      });
    }

    if (searchData.isActive !== undefined) {
      queryBuilder.andWhere('client.isActive = :isActive', {
        isActive: searchData.isActive,
      });
    }

    queryBuilder.orderBy('client.createdAt', 'DESC');

    const paginationOptions = PaginationUtils.createRepositoryPaginationOptions(
      searchData.page,
      searchData.limit,
    );

    queryBuilder.skip(paginationOptions.offset).take(paginationOptions.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return PaginationUtils.createPaginatedResult(
      { data, total },
      paginationOptions,
    );
  }
}
