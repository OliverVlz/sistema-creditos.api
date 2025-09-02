import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Language, UserRole } from 'src/shared/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  password?: string;

  @Column('json')
  profile: {
    firstName: string;
    lastName: string;
    address?: object;
    avatarUrl?: string;
  };

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.Spanish,
  })
  language: Language;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.Customer,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
