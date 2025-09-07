import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole, Language } from 'src/shared/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'document_number', unique: true, nullable: true })
  documentNumber?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({
    type: 'json',
    nullable: true,
  })
  profile?: {
    firstName: string;
    lastName: string;
    address?: object;
    avatarUrl?: string;
  };

  @Column({
    type: 'enum',
    enum: Language,
    nullable: true,
  })
  language?: Language;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
