import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

import { DocumentType } from './entity/document-type.entity';
import { LoanTypeDocumentRequirement } from './entity/loan-type-document-requirement.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { ClientDocument } from 'src/client-documents/infrastructure/entity/client-document.entity';
import { DocumentTypesController } from './document-types.controller';
import { DocumentTypeRepository } from './repositories/document-type.repository';

import { CreateDocumentTypeHandler } from '../application/create-document-type/create-document-type.handler';
import { GetDocumentTypesHandler } from '../application/get-document-types/get-document-types.handler';
import { GetDocumentTypeByIdHandler } from '../application/get-document-type-by-id/get-document-type-by-id.handler';
import { UpdateDocumentTypeHandler } from '../application/update-document-type/update-document-type.handler';
import { DeleteDocumentTypeHandler } from '../application/delete-document-type/delete-document-type.handler';
import { GetRequiredDocumentsByClientHandler } from '../application/get-required-documents-by-client/get-required-documents-by-client.handler';
import { GetDocumentRequirementsHandler } from '../application/manage-document-requirements/get-document-requirements.handler';
import { CreateDocumentRequirementHandler } from '../application/manage-document-requirements/create-document-requirement.handler';

const CommandHandlers = [
  CreateDocumentTypeHandler,
  UpdateDocumentTypeHandler,
  DeleteDocumentTypeHandler,
  CreateDocumentRequirementHandler,
];

const QueryHandlers = [
  GetDocumentTypesHandler,
  GetDocumentTypeByIdHandler,
  GetRequiredDocumentsByClientHandler,
  GetDocumentRequirementsHandler,
];

const Repositories = [
  DocumentTypeRepository,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentType, LoanTypeDocumentRequirement, Client, ClientDocument]),
    CqrsModule,
  ],
  controllers: [DocumentTypesController],
  providers: [
    ...Repositories,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    ...Repositories,
    TypeOrmModule.forFeature([DocumentType, LoanTypeDocumentRequirement]),
  ],
})
export class DocumentTypeModule {}
