import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

import { DocumentType } from './entity/document-type.entity';
import { DocumentTypesController } from './document-types.controller';
import { DocumentTypeRepository } from './repositories/document-type.repository';

import { CreateDocumentTypeHandler } from '../application/create-document-type/create-document-type.handler';
import { GetDocumentTypesHandler } from '../application/get-document-types/get-document-types.handler';
import { GetDocumentTypeByIdHandler } from '../application/get-document-type-by-id/get-document-type-by-id.handler';
import { UpdateDocumentTypeHandler } from '../application/update-document-type/update-document-type.handler';
import { DeleteDocumentTypeHandler } from '../application/delete-document-type/delete-document-type.handler';

const CommandHandlers = [
  CreateDocumentTypeHandler,
  UpdateDocumentTypeHandler,
  DeleteDocumentTypeHandler,
];

const QueryHandlers = [GetDocumentTypesHandler, GetDocumentTypeByIdHandler];

const Repositories = [DocumentTypeRepository];

@Module({
  imports: [TypeOrmModule.forFeature([DocumentType]), CqrsModule],
  controllers: [DocumentTypesController],
  providers: [...Repositories, ...CommandHandlers, ...QueryHandlers],
  exports: [...Repositories, TypeOrmModule.forFeature([DocumentType])],
})
export class DocumentTypeModule {}
