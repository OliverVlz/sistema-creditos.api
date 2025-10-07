import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { DocumentType } from './document-type.entity';
import { EmploymentStatus } from 'src/shared/enums';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity'; // Importar Organization

@Entity('loan_type_document_requirements')
@Unique(['loanTypeId', 'documentTypeId', 'organizationId', 'employmentStatus'])
export class LoanTypeDocumentRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'loan_type_id' })
  loanTypeId: string;

  @Column({ name: 'document_type_id' })
  documentTypeId: string;

  @Column({ 
    name: 'organization_id', 
    nullable: true 
  })
  organizationId?: string;

  @Column({ 
    name: 'employment_status', 
    type: 'enum',
    enum: EmploymentStatus,
    nullable: true 
  })
  employmentStatus?: EmploymentStatus;

  @Column({ 
    default: true,
    name: 'is_mandatory'
  })
  isMandatory: boolean;

  @Column({ 
    type: 'jsonb', 
    nullable: true,
    name: 'validation_rules'
  })
  validationRules?: object;

  @Column({ 
    type: 'integer', 
    default: 0,
    name: 'display_order'
  })
  displayOrder: number;

  @ManyToOne(() => DocumentType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_type_id' })
  documentType: DocumentType;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
