import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { DocumentType } from 'src/document-type/infrastructure/entity/document-type.entity';

export enum ClientDocumentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Entity('client_documents')
@Unique(['client', 'documentTypeId', 'version'])
export class ClientDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ type: 'uuid', nullable: false, name: 'client_id' })
  clientId: string;

  @Column({ type: 'uuid', nullable: true, name: 'loan_id' })
  loanId?: string;

  @Column({ type: 'uuid', nullable: false, name: 'document_type_id' })
  documentTypeId: string;

  @ManyToOne(() => DocumentType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_type_id' })
  documentType: DocumentType;

  @Column({ type: 'varchar', length: 500, nullable: false, name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'file_name' })
  fileName: string;

  @Column({ type: 'int', nullable: false, name: 'file_size' })
  fileSize: number;

  @Column({ type: 'varchar', length: 100, nullable: false, default: 'application/pdf', name: 'mime_type' })
  mimeType: string;

  @Column({ 
    type: 'enum', 
    enum: ClientDocumentStatus, 
    default: ClientDocumentStatus.PENDING,
    name: 'status'
  })
  status: ClientDocumentStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedBy: User;

  @Column({ type: 'uuid', nullable: true, name: 'verified_by' })
  verifiedById: string;

  @Column({ type: 'timestamp', nullable: true, name: 'verified_at' })
  verifiedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'verification_notes' })
  verificationNotes: string;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'upload_ip' })
  uploadIp: string;

  @Column({ type: 'text', nullable: true, name: 'upload_user_agent' })
  uploadUserAgent: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @ManyToOne(() => ClientDocument, { nullable: true })
  @JoinColumn({ name: 'replaces_document_id' })
  replacesDocument: ClientDocument;

  @Column({ type: 'uuid', nullable: true, name: 'replaces_document_id' })
  replacesDocumentId: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date;
}
