import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../entity/client.entity';
import { DomainError } from 'src/shared/domain';

type CreateClient = {
  fullName: string;
  documentNumber: string;
  phone?: string;
  address?: string;
};

type ClientFilters = {
  terms?: string;
  cursor?: string;
  size?: number;
};

type ClientPaginationFilters = {
  terms?: string;
  limit?: number;
  offset?: number;
};

type ClientSelect = { [key in keyof Client]?: boolean };

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

  async searchClients(filters: ClientFilters, select?: ClientSelect) {
    const queryBuilder = this.clientsRepository.createQueryBuilder('client');

    if (select) {
      const selectedFields = Object.keys(select)
        .filter(key => select[key])
        .map(key => `client.${key}`);
      queryBuilder.select(selectedFields);
    }

    if (filters.terms) {
      const term = filters.terms.toLowerCase().trim();

      queryBuilder
        .andWhere(`(LOWER(client.fullName) LIKE :term OR LOWER(client.documentNumber) LIKE :term OR LOWER(client.phone) LIKE :term)`,
          { term: `%${term}%` },
        )
        .addSelect(
          `CASE
            WHEN LOWER(client.fullName) = :exactTerm OR LOWER(client.documentNumber) = :exactTerm THEN 1
            WHEN LOWER(client.fullName) LIKE :startsWithTerm OR LOWER(client.documentNumber) LIKE :startsWithTerm THEN 2
            ELSE 3
          END`,
          'relevance',
        )
        .orderBy('relevance', 'ASC')
        .addOrderBy('client.createdAt', 'DESC')
        .setParameters({
          exactTerm: term,
          startsWithTerm: `${term}%`,
        });
    } else {
      queryBuilder.orderBy('client.createdAt', 'DESC');
    }

    if (filters.cursor) {
      queryBuilder.andWhere('client.id > :cursor', { cursor: filters.cursor });
    }

    if (filters.size) {
      queryBuilder.limit(filters.size);
    }

    const clients = await queryBuilder.getMany();

    return {
      clients,
      cursor: clients.length > 0 ? clients[clients.length - 1].id : undefined,
    };
  }

  async findAll() {
    const clients = await this.clientsRepository.find({
      order: { createdAt: 'DESC' },
    });
    return clients;
  }

  async findOne(id: number) {
    const client = await this.clientsRepository.findOne({ where: { id } });
    if (!client) {
      throw new DomainError('CLIENT_NOT_FOUND', 'Client not found');
    }
    return client;
  }

  async update(id: number, client: Partial<CreateClient>) {
    await this.clientsRepository.update(id, client);
    return this.findOne(id);
  }

  async remove(id: number) {
    const deleteResult = await this.clientsRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new DomainError('CLIENT_NOT_FOUND', 'Client not found');
    }
  }

  async findByDocumentNumber(documentNumber: string) {
    const client = await this.clientsRepository.findOne({ where: { documentNumber } });
    return client;
  }

  /**
   * Nuevo método con paginación offset-based
   */
  async searchClientsWithPagination(filters: ClientPaginationFilters, select?: ClientSelect) {
    const queryBuilder = this.clientsRepository.createQueryBuilder('client');

    if (select) {
      const selectedFields = Object.keys(select)
        .filter(key => select[key])
        .map(key => `client.${key}`);
      queryBuilder.select(selectedFields);
    }

    if (filters.terms) {
      const term = filters.terms.toLowerCase().trim();

      queryBuilder
        .andWhere(`(LOWER(client.fullName) LIKE :term OR LOWER(client.documentNumber) LIKE :term OR LOWER(client.phone) LIKE :term)`,
          { term: `%${term}%` },
        )
        .addSelect(
          `CASE
            WHEN LOWER(client.fullName) = :exactTerm OR LOWER(client.documentNumber) = :exactTerm THEN 1
            WHEN LOWER(client.fullName) LIKE :startsWithTerm OR LOWER(client.documentNumber) LIKE :startsWithTerm THEN 2
            ELSE 3
          END`,
          'relevance',
        )
        .orderBy('relevance', 'ASC')
        .addOrderBy('client.createdAt', 'DESC')
        .setParameters({
          exactTerm: term,
          startsWithTerm: `${term}%`,
        });
    } else {
      queryBuilder.orderBy('client.createdAt', 'DESC');
    }

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    const [clients, total] = await queryBuilder.getManyAndCount();

    return {
      clients,
      total,
    };
  }
}
