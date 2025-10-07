import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetDocumentRequirementsQuery } from './get-document-requirements.query';
import { LoanTypeDocumentRequirement } from '../../infrastructure/entity/loan-type-document-requirement.entity';
import { DocumentType } from '../../infrastructure/entity/document-type.entity';
import { Organization } from 'src/organization/infrastructure/entity/organization.entity';

interface DocumentRequirementResult {
  id: string;
  documentType: {
    id: string;
    code: string;
    name: string;
    description?: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  employmentStatus?: string;
  isMandatory: boolean;
  displayOrder: number;
  validationRules?: object;
  createdAt: Date;
}

@QueryHandler(GetDocumentRequirementsQuery)
export class GetDocumentRequirementsHandler implements IQueryHandler<GetDocumentRequirementsQuery> {
  constructor(
    @InjectRepository(LoanTypeDocumentRequirement)
    private requirementRepository: Repository<LoanTypeDocumentRequirement>,
  ) {}

  async execute(query: GetDocumentRequirementsQuery): Promise<DocumentRequirementResult[]> {
    const { loanTypeId } = query;

    const requirements = await this.requirementRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.documentType', 'dt')
      .leftJoinAndSelect('req.organization', 'org')
      .where('req.loanTypeId = :loanTypeId', { loanTypeId })
      .orderBy('req.displayOrder', 'ASC')
      .addOrderBy('dt.name', 'ASC')
      .getMany();

    return requirements.map(req => ({
      id: req.id,
      documentType: {
        id: req.documentType.id,
        code: req.documentType.code,
        name: req.documentType.name,
        description: req.documentType.description,
      },
      organization: req.organization ? {
        id: req.organization.id,
        name: req.organization.name,
      } : undefined,
      employmentStatus: req.employmentStatus,
      isMandatory: req.isMandatory,
      displayOrder: req.displayOrder,
      validationRules: req.validationRules,
      createdAt: req.createdAt,
    }));
  }
}

