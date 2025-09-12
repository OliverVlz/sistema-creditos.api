import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindOptionsSelect } from 'typeorm';

import { User } from '../entity/user.entity';
import { UserRole } from 'src/shared/enums';
import { PaginationUtils } from 'src/shared/utils/pagination.utils';

/** Can be used to select only the specified fields from a query result */
type UserSelect = { [key in keyof User]?: boolean };

type UserPaginationFilters = {
  role?: UserRole;
  terms?: string;
  limit?: number;
  offset?: number;
};

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async create(data: Partial<User>) {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async findUsers(role?: UserRole, terms?: string) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.where({ role });
    }

    if (terms) {
      const searchTerm = terms.toLowerCase().trim();
      queryBuilder.andWhere(
        '(LOWER(JSON_EXTRACT(user.profile, "$.firstName")) LIKE :searchTerm OR LOWER(JSON_EXTRACT(user.profile, "$.lastName")) LIKE :searchTerm OR LOWER(user.email) LIKE :searchTerm OR LOWER(user.phone) LIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` },
      );
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findById(userId: string, failIfNotFound = false, select?: UserSelect) {
    const findOptions: FindOneOptions<User> = {
      where: { id: userId },
    };

    if (select) {
      findOptions.select = select as FindOptionsSelect<User>;
    }

    const user = await this.userRepository.findOne(findOptions);

    if (!user && failIfNotFound) {
      throw new NotFoundException(`User '${userId}' not found`);
    }
    return user;
  }

  async findByEmail(email: string, failIfNotFound = false) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user && failIfNotFound) {
      throw new NotFoundException(`User '${email}' not found`);
    }
    return user;
  }

  async findByPhone(phone: string, failIfNotFound = false) {
    const user = await this.userRepository.findOne({ where: { phone } });
    if (!user && failIfNotFound) {
      throw new NotFoundException(`User '${phone}' not found`);
    }
    return user;
  }

  async update(userId: string, data: Partial<User>) {
    await this.userRepository.update(userId, data);
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async updatePassword(userId: string, password: string) {
    return this.userRepository.update(userId, { password });
  }

  /**
   * Método con paginación offset-based usando PaginationUtils
   */
  async searchUsersWithPagination(filters: { role?: UserRole; terms?: string; page?: number; limit?: number; }) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (filters.role) {
      queryBuilder.where('user.role = :role', { role: filters.role });
    }

    if (filters.terms) {
      const searchTerm = filters.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        '(LOWER(JSON_EXTRACT(user.profile, "$.firstName")) LIKE :searchTerm OR LOWER(JSON_EXTRACT(user.profile, "$.lastName")) LIKE :searchTerm OR LOWER(user.email) LIKE :searchTerm OR LOWER(user.phone) LIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` },
      );
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');

    const paginationOptions = PaginationUtils.createRepositoryPaginationOptions(
      filters.page,
      filters.limit,
    );

    queryBuilder
      .skip(paginationOptions.offset)
      .take(paginationOptions.limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return PaginationUtils.createPaginatedResult(
      { data: users, total },
      paginationOptions,
    );
  }

  /**
   * Método para obtener usuarios con información de cliente (JOIN con tabla clients)
   */
  async searchUsersWithClientInfo(filters: { role?: UserRole; terms?: string; page?: number; limit?: number; userId?: string; }) {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('clients', 'client', 'client.user_id = user.id');

    if (filters.role) {
      queryBuilder.where('user.role = :role', { role: filters.role });
    }

    if (filters.userId) {
      queryBuilder.andWhere('user.id = :userId', { userId: filters.userId });
    }

    if (filters.terms) {
      const searchTerm = filters.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        '(LOWER(JSON_EXTRACT(user.profile, "$.firstName")) LIKE :searchTerm OR LOWER(JSON_EXTRACT(user.profile, "$.lastName")) LIKE :searchTerm OR LOWER(user.email) LIKE :searchTerm OR LOWER(user.phone) LIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` },
      );
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');

    const paginationOptions = PaginationUtils.createRepositoryPaginationOptions(
      filters.page,
      filters.limit,
    );

    queryBuilder
      .skip(paginationOptions.offset)
      .take(paginationOptions.limit);

    const result = await queryBuilder.getRawAndEntities();
    const total = await queryBuilder.getCount();

    // Mapear el resultado para incluir la información del cliente
    const usersWithClient = result.entities.map((user, index) => {
      const raw = result.raw[index];
      return {
        ...user,
        client: raw.client_id ? {
          id: raw.client_id,
          creditScore: raw.client_credit_score,
          maxCreditLimit: raw.client_max_credit_limit,
          riskLevel: raw.client_risk_level,
          isActive: raw.client_is_active,
          createdAt: raw.client_created_at,
          updatedAt: raw.client_updated_at,
        } : null
      };
    });

    return PaginationUtils.createPaginatedResult(
      { data: usersWithClient, total },
      paginationOptions,
    );
  }
}
