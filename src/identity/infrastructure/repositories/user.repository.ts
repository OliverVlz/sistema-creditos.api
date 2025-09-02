import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, FindOptionsSelect } from 'typeorm';

import { User } from '../entity/user.entity';
import { UserRole } from 'src/shared/enums';

/** Can be used to select only the specified fields from a query result */
type UserSelect = { [key in keyof User]?: boolean };

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

  async findUsers(role?: UserRole) {
    const findOptions: FindOneOptions<User> = {};
    if (role) {
      findOptions.where = { role };
    }
    return this.userRepository.find(findOptions);
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
}
