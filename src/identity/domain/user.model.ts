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
  readonly documentNumber: string;
  readonly phoneNumber?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
  readonly role: UserRole;
  readonly isActive: boolean;

  constructor(params: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    documentNumber: string;
    phoneNumber?: string;
    createdAt: Date;
    updatedAt: Date;
    role: UserRole;
    isActive: boolean;
  }) {
    this.id = params.id;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.email = params.email;
    this.documentNumber = params.documentNumber;
    this.phoneNumber = params.phoneNumber;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
    this.role = params.role;
    this.isActive = params.isActive;
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
      documentNumber: entity.documentNumber,
      phoneNumber: entity.phoneNumber,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      role: entity.role,
      isActive: entity.isActive,
      ...params,
    });
  }

  getUserInfo() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      documentNumber: this.documentNumber,
      phoneNumber: this.phoneNumber,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive,
      role: this.role,
    };
  }
}
