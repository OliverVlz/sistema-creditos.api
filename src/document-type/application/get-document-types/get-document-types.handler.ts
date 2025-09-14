import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetDocumentTypesQuery } from './get-document-types.query';
import { DocumentTypeRepository } from '../../infrastructure/repositories/document-type.repository';

@QueryHandler(GetDocumentTypesQuery)
export class GetDocumentTypesHandler implements IQueryHandler<GetDocumentTypesQuery> {
  constructor(private readonly documentTypeRepository: DocumentTypeRepository) {}

  async execute(query: GetDocumentTypesQuery): Promise<any> {
    return this.documentTypeRepository.searchDocumentTypesWithPagination(query);
  }
}
