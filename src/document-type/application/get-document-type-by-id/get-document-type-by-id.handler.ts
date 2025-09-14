import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetDocumentTypeByIdQuery } from './get-document-type-by-id.query';
import { DocumentTypeRepository } from '../../infrastructure/repositories/document-type.repository';

@QueryHandler(GetDocumentTypeByIdQuery)
export class GetDocumentTypeByIdHandler implements IQueryHandler<GetDocumentTypeByIdQuery> {
  constructor(private readonly documentTypeRepository: DocumentTypeRepository) {}

  async execute(query: GetDocumentTypeByIdQuery): Promise<any> {
    return this.documentTypeRepository.findOne(query.id);
  }
}
