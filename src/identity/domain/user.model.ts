import { User as UserEntity } from '../infrastructure/entity/user.entity';
import { UserRole } from 'src/shared/enums';

export class User {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  documentNumber: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  private constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  static fromModel(entity: UserEntity): User {
    return new User({
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      documentNumber: entity.documentNumber,
      phoneNumber: entity.phoneNumber,
      role: entity.role,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  getUserInfo() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      documentNumber: this.documentNumber,
      phoneNumber: this.phoneNumber,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
