import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany, // Añadido OneToMany
} from 'typeorm';
import { User } from 'src/identity/infrastructure/entity/user.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity'; // Importar Client
import { LoanType } from 'src/loan-type/infrastructure/entity/loan-type.entity'; // Importar LoanType
import { Loan } from 'src/loan/infrastructure/entity/loan.entity'; // Importar Loan
import { LoanTypeDocumentRequirement } from 'src/document-type/infrastructure/entity/loan-type-document-requirement.entity'; // Corregida la ruta

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'base_interest_rate', type: 'decimal', precision: 5, scale: 2 })
  baseInterestRate: number;

  @Column({ name: 'discount_rate', type: 'decimal', precision: 5, scale: 2 })
  discountRate: number;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2 })
  taxRate: number;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updater?: User;

  @OneToMany(() => Client, client => client.organization)
  clients: Client[];

  @OneToMany(() => LoanType, loanType => loanType.organization)
  loanTypes: LoanType[];

  @OneToMany(() => Loan, loan => loan.organization)
  loans: Loan[];

  @OneToMany(() => LoanTypeDocumentRequirement, loanTypeDocumentRequirement => loanTypeDocumentRequirement.organization)
  loanTypeDocumentRequirements: LoanTypeDocumentRequirement[];
}
