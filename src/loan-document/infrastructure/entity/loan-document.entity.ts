import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Loan } from 'src/loan/infrastructure/entity/loan.entity';
import { DocumentType } from 'src/document-type/infrastructure/entity/document-type.entity';

export enum LoanDocumentStatus {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
}

@Entity('loan_documents')
export class LoanDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({
    type: 'enum',
    enum: LoanDocumentStatus,
    default: LoanDocumentStatus.PENDIENTE,
  })
  status: LoanDocumentStatus;

  @Column({ name: 'rejection_note', nullable: true, type: 'text' })
  rejectionNote?: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Loan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @ManyToOne(() => DocumentType)
  @JoinColumn({ name: 'document_type_id' })
  documentType: DocumentType;
}

