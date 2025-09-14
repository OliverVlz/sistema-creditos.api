import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/identity/infrastructure/entity/user.entity';

@Entity('document_types')
export class DocumentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ 
    type: 'jsonb', 
    default: '["application/pdf"]',
    name: 'mime_types'
  })
  mimeTypes: string[];

  @Column({ 
    type: 'integer', 
    default: 10485760,
    name: 'max_file_size'
  })
  maxFileSize: number;

  @Column({ 
    type: 'jsonb', 
    nullable: true,
    name: 'validation_rules'
  })
  validationRules?: object;

  @Column({ 
    default: true,
    name: 'is_active'
  })
  isActive: boolean;

  @Column({ 
    type: 'integer', 
    default: 0,
    name: 'display_order'
  })
  displayOrder: number;

  @Column({ 
    nullable: true,
    name: 'created_by'
  })
  createdBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
