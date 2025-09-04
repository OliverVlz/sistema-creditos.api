import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindOptionsSelect } from 'typeorm';

import { User } from '../entity/user.entity';
import { UserRole } from 'src/shared/enums';

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
  ) {}

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
        '(LOWER(user.firstName) LIKE :searchTerm OR LOWER(user.lastName) LIKE :searchTerm OR LOWER(user.email) LIKE :searchTerm OR LOWER(user.phone) LIKE :searchTerm)',
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
   * Nuevo método con paginación offset-based
   */
  async searchUsersWithPagination(filters: UserPaginationFilters, select?: UserSelect) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (select) {
      const selectedFields = Object.keys(select)
        .filter(key => select[key])
        .map(key => `user.${key}`);
      queryBuilder.select(selectedFields);
    }

    if (filters.role) {
      queryBuilder.where('user.role = :role', { role: filters.role });
    }

    if (filters.terms) {
      const searchTerm = filters.terms.toLowerCase().trim();
      queryBuilder.andWhere(
        '(LOWER(user.firstName) LIKE :searchTerm OR LOWER(user.lastName) LIKE :searchTerm OR LOWER(user.email) LIKE :searchTerm OR LOWER(user.phone) LIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` },
      );
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users,
      total,
    };
  }
}
