import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../entity/client.entity';
import { DomainError } from 'src/shared/domain';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';

type CreateClient = {
  firstName: string;
  lastName: string;
  documentNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  organizationId: string;
  createdBy: string;
};

type UpdateClient = {
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  organizationId?: string;
  updatedBy: string;
  isActive?: boolean;
};

type ClientSearchData = {
  terms?: string;
  page?: number;
  limit?: number;
  organizationId?: string;
  isActive?: boolean;
};

@Injectable()
export class ClientRepository {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
  ) {}

  async create(client: CreateClient) {
    const createdClient = this.clientsRepository.create(client);
    return this.clientsRepository.save(createdClient);
  }

  async findAll() {
    const clients = await this.clientsRepository.find({
      relations: ['organization', 'creator', 'updater'],
      order: { createdAt: 'DESC' },
    });
    return clients;
  }

  async findOne(id: string) {
    const client = await this.clientsRepository.findOne({ 
      where: { id },
      relations: ['organization', 'creator', 'updater']
    });
    if (!client) {
      throw new DomainError('CLIENT_NOT_FOUND', 'Client not found');
    }
    return client;
  }

  async update(id: string, client: UpdateClient) {
    await this.clientsRepository.update(id, client);
    return this.findOne(id);
  }

  async remove(id: string) {
    const deleteResult = await this.clientsRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new DomainError('CLIENT_NOT_FOUND', 'Client not found');
    }
  }

  async findByDocumentNumber(documentNumber: string) {
    const client = await this.clientsRepository.findOne({ 
      where: { documentNumber },
      relations: ['organization']
    });
    return client;
  }

  async searchClientsWithPagination(searchData: ClientSearchData) {
    const queryBuilder = this.clientsRepository.createQueryBuilder('client')
      .leftJoinAndSelect('client.organization', 'organization')
      .leftJoinAndSelect('client.creator', 'creator')
      .leftJoinAndSelect('client.updater', 'updater');

    if (searchData.terms) {
      const term = searchData.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        `(LOWER(client.firstName) LIKE :term OR LOWER(client.lastName) LIKE :term OR LOWER(client.documentNumber) LIKE :term OR LOWER(client.email) LIKE :term)`,
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
