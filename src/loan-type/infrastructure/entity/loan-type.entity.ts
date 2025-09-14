import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('loan_types')
export class LoanType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'base_processing_fee', type: 'decimal', precision: 5, scale: 2 })
  baseProcessingFee: number;

  @Column({ name: 'max_amount', type: 'decimal', precision: 10, scale: 2 })
  maxAmount: number;

  @Column({ name: 'min_amount', type: 'decimal', precision: 10, scale: 2 })
  minAmount: number;

  @Column({ name: 'max_term_months' })
  maxTermMonths: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'required_document_types' })
  requiredDocumentTypes: string[]; // Ahora almacenará IDs de DocumentDefinition
}




