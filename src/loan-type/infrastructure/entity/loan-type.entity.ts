import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Loan } from 'src/loan/infrastructure/entity/loan.entity';
import { DocumentType } from 'src/document-type/infrastructure/entity/document-type.entity';

@Entity('loan_types')
export class LoanType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    name: 'interest_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  interestRate: number;

  @Column({ name: 'min_amount', type: 'decimal', precision: 14, scale: 2 })
  minAmount: number;

  @Column({ name: 'max_amount', type: 'decimal', precision: 14, scale: 2 })
  maxAmount: number;

  @Column({ name: 'min_term', type: 'int' })
  minTerm: number;

  @Column({ name: 'max_term', type: 'int' })
  maxTerm: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Loan, loan => loan.loanType)
  loans: Loan[];

  @ManyToMany(() => DocumentType)
  @JoinTable({
    name: 'loan_type_documents',
    joinColumn: { name: 'loan_type_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'document_type_id', referencedColumnName: 'id' },
  })
  requiredDocuments: DocumentType[];
}
