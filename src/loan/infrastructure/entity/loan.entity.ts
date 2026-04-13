import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { LoanType } from 'src/loan-type/infrastructure/entity/loan-type.entity';
import { LoanDocument } from 'src/loan-document/infrastructure/entity/loan-document.entity';

export enum LoanStatus {
  PENDIENTE = 'pendiente',
  PREAPROBADO = 'preaprobado',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  DESEMBOLSADO = 'desembolsado',
}

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'loan_number', unique: true })
  loanNumber: string;

  @Column({
    name: 'amount_requested',
    type: 'decimal',
    precision: 14,
    scale: 2,
  })
  amountRequested: number;

  @Column({ name: 'term_months' })
  termMonths: number;

  @Column({
    name: 'applied_interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  appliedInterestRate: number;

  @Column({ name: 'monthly_payment', type: 'decimal', precision: 14, scale: 2 })
  monthlyPayment: number;

  @Column({ name: 'total_interest', type: 'bigint' })
  totalInterest: number;

  @Column({ name: 'total_payable', type: 'bigint' })
  totalPayable: number;

  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.PENDIENTE,
  })
  status: LoanStatus;

  @Column({ name: 'rejection_reason', nullable: true, type: 'text' })
  rejectionReason?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'managed_by' })
  manager: User;

  @Column({ name: 'managed_at', nullable: true })
  managedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => LoanType)
  @JoinColumn({ name: 'loan_type_id' })
  loanType: LoanType;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => LoanDocument, document => document.loan)
  documents: LoanDocument[];
}
