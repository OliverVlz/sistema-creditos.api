import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { LoanType } from 'src/loan-type/infrastructure/entity/loan-type.entity'; // Nueva importación

export enum LoanStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DEFAULTED = 'defaulted',
  CANCELLED = 'cancelled',
}

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'loan_number', unique: true })
  loanNumber: string;

  @Column({ name: 'amount_requested', type: 'decimal', precision: 10, scale: 2 })
  amountRequested: number; // Renombrado de 'amount'

  @Column({ name: 'term_months' })
  termMonths: number;

  @Column({ name: 'monthly_payment', type: 'decimal', precision: 10, scale: 2 })
  monthlyPayment: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number; // Nuevo atributo

  @Column({ name: 'interest_rate', type: 'decimal', precision: 5, scale: 2 })
  interestRate: number;

  @Column({ name: 'processing_fee', type: 'decimal', precision: 10, scale: 2 })
  processingFee: number; // Nuevo atributo

  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.PENDING,
  })
  status: LoanStatus;

  @Column({ name: 'rejection_reason', nullable: true })
  rejectionReason?: string; // Nuevo atributo

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy?: string; // Nuevo atributo

  @Column({ name: 'approved_at', nullable: true })
  approvedAt?: Date; // Nuevo atributo

  @Column({ name: 'signed_at', type: 'date', nullable: true })
  signedAt?: Date; // Nuevo atributo

  @Column({ name: 'disbursed_at', type: 'date', nullable: true })
  disbursedAt?: Date; // Nuevo atributo

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @ManyToOne(() => LoanType) // Nueva relación
  @JoinColumn({ name: 'loan_type_id' })
  loanType: LoanType;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  @ManyToOne(() => User) // Relación para approvedBy
  @JoinColumn({ name: 'approved_by' })
  approver: User;
}
