import { Language } from 'src/shared/enums';

import { User as UserEntity } from '../infrastructure/entity/user.entity';
import { UserRole } from 'src/shared/enums';

type ExtendedUserEntity = UserEntity & {
  createdAt?: Date;
  updatedAt?: Date;
};
type ExtendedUserParams = object;

export class User {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: object;
  readonly language?: Language;
  readonly avatarUrl?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly role: UserRole;

  constructor(params: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: object;
    language?: Language;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    role: UserRole;
  }) {
    this.id = params.id;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.email = params.email;
    this.phone = params.phone;
    this.address = params.address || {};
    this.language = params.language;
    this.avatarUrl = params.avatarUrl;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
    this.role = params.role;
  }

  static fromModel(
    entity: ExtendedUserEntity,
    params: ExtendedUserParams = {},
  ): User {
    return new User({
      id: entity.id,
      firstName: entity.profile.firstName,
      lastName: entity.profile.lastName,
      email: entity.email,
      phone: entity.phone,
      address: entity.profile.address,
      language: entity.language,
      avatarUrl: entity.profile.avatarUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      role: entity.role,
      ...params,
    });
  }

  getUserInfo() {
    return {
      id: this.id,
      email: this.email,
      phone: this.phone,
      profile: {
        firstName: this.firstName,
        lastName: this.lastName,
        address: this.address,
        avatarUrl: this.avatarUrl,
      },
      language: this.language,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      role: this.role,
    };
  }
}
