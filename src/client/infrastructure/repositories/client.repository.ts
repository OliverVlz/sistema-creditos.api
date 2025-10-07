import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../entity/client.entity';
import { DomainError } from 'src/shared/domain';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';
import { EmploymentStatus } from 'src/shared/enums';

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
  ) {}

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
      relations: ['organization', 'creator', 'updater', 'user']
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
        documentNumber // Apuntar directamente a la propiedad de Client
      },
      relations: ['organization', 'user']
    });
    return client;
  }

  async searchClientsWithPagination(searchData: ClientSearchData) {
    const queryBuilder = this.clientsRepository.createQueryBuilder('client')
      .leftJoinAndSelect('client.organization', 'organization')
      .leftJoinAndSelect('client.creator', 'creator')
      .leftJoinAndSelect('client.updater', 'updater')
      .leftJoinAndSelect('client.user', 'user'); // No unimos con profile aquí

    if (searchData.terms) {
      const term = searchData.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        // Buscar por firstName, lastName de User y documentNumber de Client
        `(LOWER(user.firstName) LIKE :term OR LOWER(user.lastName) LIKE :term OR LOWER(client.documentNumber) LIKE :term OR LOWER(user.email) LIKE :term)`,
        { term: `%${term}%` }
      );
    }

    if (searchData.organizationId) {
      queryBuilder.andWhere('client.organizationId = :organizationId', { 
        organizationId: searchData.organizationId 
      });
    }

    if (searchData.isActive !== undefined) {
      queryBuilder.andWhere('client.isActive = :isActive', { 
        isActive: searchData.isActive 
      });
    }

    queryBuilder.orderBy('client.createdAt', 'DESC');

    const paginationOptions = PaginationUtils.createRepositoryPaginationOptions(
      searchData.page,
      searchData.limit,
    );

    queryBuilder
      .skip(paginationOptions.offset)
      .take(paginationOptions.limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return PaginationUtils.createPaginatedResult(
      { data, total },
      paginationOptions,
    );
  }
}
