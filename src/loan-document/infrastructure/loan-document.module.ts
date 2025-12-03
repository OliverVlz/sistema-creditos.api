import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

import { LoanDocument } from './entity/loan-document.entity';
import { LoanDocumentController } from './loan-document.controller';
import { LoanDocumentRepository } from './repositories/loan-document.repository';

import { CreateLoanDocumentHandler } from '../application/create-loan-document/create-loan-document.handler';
import { UpdateLoanDocumentHandler } from '../application/update-loan-document/update-loan-document.handler';
import { DeleteLoanDocumentHandler } from '../application/delete-loan-document/delete-loan-document.handler';
import { GetLoanDocumentByIdHandler } from '../application/get-loan-document-by-id/get-loan-document-by-id.handler';
import { GetLoanDocumentsByLoanHandler } from '../application/get-loan-documents-by-loan/get-loan-documents-by-loan.handler';

const CommandHandlers = [
  CreateLoanDocumentHandler,
  UpdateLoanDocumentHandler,
  DeleteLoanDocumentHandler,
];

const QueryHandlers = [
  GetLoanDocumentByIdHandler,
  GetLoanDocumentsByLoanHandler,
];

const Repositories = [LoanDocumentRepository];

@Module({
  imports: [TypeOrmModule.forFeature([LoanDocument]), CqrsModule],
  controllers: [LoanDocumentController],
  providers: [...Repositories, ...CommandHandlers, ...QueryHandlers],
  exports: [...Repositories, TypeOrmModule.forFeature([LoanDocument])],
})
export class LoanDocumentModule {}

