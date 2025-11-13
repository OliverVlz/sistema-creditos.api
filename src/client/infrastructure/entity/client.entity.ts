import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { EmploymentStatus } from 'src/shared/enums';
import { Loan } from 'src/loan/infrastructure/entity/loan.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    name: 'employment_status',
    type: 'enum',
    enum: EmploymentStatus,
  })
  employmentStatus: EmploymentStatus;

  @Column({ name: 'address' })
  address: string;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, user => user.client)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  @OneToMany(() => Loan, loan => loan.client)
  loans: Loan[];
}
