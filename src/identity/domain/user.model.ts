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
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly role: UserRole;

  constructor(params: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
    role: UserRole;
  }) {
    this.id = params.id;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.email = params.email;
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
      firstName: entity.firstName || '',
      lastName: entity.lastName || '',
      email: entity.email,
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
      firstName: this.firstName,
      lastName: this.lastName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      role: this.role,
    };
  }
}
