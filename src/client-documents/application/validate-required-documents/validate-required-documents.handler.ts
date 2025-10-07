import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidateRequiredDocumentsQuery } from './validate-required-documents.query';
import { ClientDocument } from '../../infrastructure/entity/client-document.entity';
import { DocumentType } from 'src/document-type/infrastructure/entity/document-type.entity';
import { LoanTypeDocumentRequirement } from 'src/document-type/infrastructure/entity/loan-type-document-requirement.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { EmploymentStatus } from 'src/shared/enums';

interface DocumentValidationResult {
  isValid: boolean;
  missingDocuments: Array<{
    documentTypeId: string;
    documentCode: string;
    documentName: string;
    isMandatory: boolean;
  }>;
  uploadedDocuments: Array<{
    documentTypeId: string;
    documentCode: string;
    documentName: string;
    status: string;
    uploadedAt: Date;
  }>;
  canCreateLoan: boolean;
}

@QueryHandler(ValidateRequiredDocumentsQuery)
export class ValidateRequiredDocumentsHandler implements IQueryHandler<ValidateRequiredDocumentsQuery> {
  constructor(
    @InjectRepository(ClientDocument)
    private clientDocumentRepository: Repository<ClientDocument>,
    @InjectRepository(DocumentType)
    private documentTypeRepository: Repository<DocumentType>,
    @InjectRepository(LoanTypeDocumentRequirement)
    private requirementRepository: Repository<LoanTypeDocumentRequirement>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async execute(query: ValidateRequiredDocumentsQuery): Promise<DocumentValidationResult> {
    const { loanTypeId, clientId } = query;

    const client = await this.clientRepository.findOne({
      where: { id: clientId },
      relations: ['organization']
    });

    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    const requiredDocuments = await this.requirementRepository
      .createQueryBuilder('req')
      .innerJoin('req.documentType', 'dt')
      .where('req.loanTypeId = :loanTypeId', { loanTypeId })
      .andWhere('dt.isActive = true')
      .andWhere(
        '(req.organizationId = :organizationId OR req.organizationId IS NULL)',
        { organizationId: client.organization.id }
      )
      .andWhere(
        '(req.employmentStatus = :employmentStatus OR req.employmentStatus = :all OR req.employmentStatus IS NULL)',
        { 
          employmentStatus: client.employmentStatus,
          all: EmploymentStatus.ALL 
        }
      )
      .select([
        'dt.id as documentTypeId',
        'dt.code as documentCode',
        'dt.name as documentName',
        'req.isMandatory as isMandatory'
      ])
      .getRawMany();

    const uploadedDocuments = await this.clientDocumentRepository
      .createQueryBuilder('cd')
      .innerJoin('cd.documentType', 'dt')
      .where('cd.clientId = :clientId', { clientId })
      .andWhere('cd.documentTypeId IN (:...documentTypeIds)', {
        documentTypeIds: requiredDocuments.map(doc => doc.documentTypeId)
      })
      .select([
        'cd.documentTypeId as documentTypeId',
        'dt.code as documentCode',
        'dt.name as documentName',
        'cd.status as status',
        'cd.createdAt as uploadedAt'
      ])
      .getRawMany();

    const uploadedDocumentTypeIds = new Set(uploadedDocuments.map(doc => doc.documentTypeId));
    
    const missingDocuments = requiredDocuments
      .filter(doc => !uploadedDocumentTypeIds.has(doc.documentTypeId))
      .map(doc => ({
        documentTypeId: doc.documentTypeId,
        documentCode: doc.documentCode,
        documentName: doc.documentName,
        isMandatory: doc.isMandatory
      }));

    const mandatoryMissing = missingDocuments.filter(doc => doc.isMandatory);
    const canCreateLoan = mandatoryMissing.length === 0;

    return {
      isValid: canCreateLoan,
      missingDocuments,
      uploadedDocuments: uploadedDocuments.map(doc => ({
        documentTypeId: doc.documentTypeId,
        documentCode: doc.documentCode,
        documentName: doc.documentName,
        status: doc.status,
        uploadedAt: doc.uploadedAt
      })),
      canCreateLoan
    };
  }
}

