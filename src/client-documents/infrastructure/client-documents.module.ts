import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

import { ClientDocument } from './entity/client-document.entity';
import { DocumentType } from 'src/document-type/infrastructure/entity/document-type.entity';
import { LoanTypeDocumentRequirement } from 'src/document-type/infrastructure/entity/loan-type-document-requirement.entity';
import { Client } from 'src/client/infrastructure/entity/client.entity';
import { ClientDocumentsController } from './controllers/client-documents.controller';

import { ValidateRequiredDocumentsHandler } from '../application/validate-required-documents/validate-required-documents.handler';

const QueryHandlers = [
  ValidateRequiredDocumentsHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientDocument, DocumentType, LoanTypeDocumentRequirement, Client]),
    CqrsModule,
  ],
  controllers: [ClientDocumentsController],
  providers: [
    ...QueryHandlers,
  ],
  exports: [
    TypeOrmModule.forFeature([ClientDocument]),
  ],
})
export class ClientDocumentsModule {}

