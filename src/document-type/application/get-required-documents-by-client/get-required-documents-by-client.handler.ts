import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetRequiredDocumentsByClientQuery } from './get-required-documents-by-client.query';
import { DocumentType } from '../../infrastructure/entity/document-type.entity';
import { LoanTypeDocumentRequirement } from '../../infrastructure/entity/loan-type-document-requirement.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { ClientDocument } from 'src/client-documents/infrastructure/entity/client-document.entity';
import { EmploymentStatus } from 'src/shared/enums';

interface RequiredDocumentResult {
  documentTypeId: string;
  documentCode: string;
  documentName: string;
  isMandatory: boolean;
  displayOrder: number;
  description?: string;
  mimeTypes: string[];
  maxFileSize: number;
}

@QueryHandler(GetRequiredDocumentsByClientQuery)
export class GetRequiredDocumentsByClientHandler implements IQueryHandler<GetRequiredDocumentsByClientQuery> {
  constructor(
    @InjectRepository(DocumentType)
    private documentTypeRepository: Repository<DocumentType>,
    @InjectRepository(LoanTypeDocumentRequirement)
    private requirementRepository: Repository<LoanTypeDocumentRequirement>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {}

  async execute(query: GetRequiredDocumentsByClientQuery): Promise<RequiredDocumentResult[]> {
    const { loanTypeId, clientId } = query;

    const client = await this.clientRepository.findOne({
      where: { id: clientId },
      relations: ['organization']
    });

    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    const queryBuilder = this.documentTypeRepository
      .createQueryBuilder('dt')
      .innerJoin(
        'loan_type_document_requirements',
        'req',
        'dt.id = req.document_type_id'
      )
      .where('req.loan_type_id = :loanTypeId', { loanTypeId })
      .andWhere('dt.is_active = true')
      .andWhere(
        '(req.organization_id = :organizationId OR req.organization_id IS NULL)',
        { organizationId: client.organizationId }
      )
      .andWhere(
        '(req.employment_status = :employmentStatus OR req.employment_status = :all OR req.employment_status IS NULL)',
        { 
          employmentStatus: client.employmentStatus,
          all: EmploymentStatus.ALL 
        }
      )
      .select([
        'dt.id as documentTypeId',
        'dt.code as documentCode',
        'dt.name as documentName',
        'dt.description as description',
        'dt.mime_types as mimeTypes',
        'dt.max_file_size as maxFileSize',
        'req.is_mandatory as isMandatory',
        'req.display_order as displayOrder'
      ])
      .orderBy('req.display_order', 'ASC')
      .addOrderBy('dt.name', 'ASC');

    const results = await queryBuilder.getRawMany();

    return results.map(result => ({
      documentTypeId: result.documentTypeId,
      documentCode: result.documentCode,
      documentName: result.documentName,
      description: result.description,
      mimeTypes: JSON.parse(result.mimeTypes || '["application/pdf"]'),
      maxFileSize: result.maxFileSize,
      isMandatory: result.isMandatory,
      displayOrder: result.displayOrder || 0
    }));
  }
}
