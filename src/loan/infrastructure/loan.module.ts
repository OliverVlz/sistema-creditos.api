import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

import { Loan } from './entity/loan.entity';
import { LoansController } from './loan.controller';
import { LoanRepository } from './repositories/loan.repository';
import { LoanCalculatorService } from '../domain/loan-calculator.service';

import { CreateLoanHandler } from '../application/create-loan/create-loan.handler';
import { CreateLoanWithFilesHandler } from '../application/create-loan-with-files/create-loan-with-files.handler';
import { GetLoansHandler } from '../application/get-loans/get-loans.handler';
import { GetLoanByIdHandler } from '../application/get-loan-by-id/get-loan-by-id.handler';
import { UpdateLoanHandler } from '../application/update-loan/update-loan.handler';
import { UpdateLoanWithFilesHandler } from '../application/update-loan-with-files/update-loan-with-files.handler';
import { SoftDeleteLoanHandler } from '../application/soft-delete-loan/soft-delete-loan.handler';
import { CalculateLoanHandler } from '../application/calculate-loan/calculate-loan.handler';

import { ClientsModule } from 'src/client/infrastructure/client.module';
import { OrganizationModule } from 'src/organization/infrastructure/organization.module';
import { IdentityModule } from 'src/identity/infrastructure/identity.module';
import { LoanTypeModule } from 'src/loan-type/infrastructure/loan-type.module';
import { LoanDocumentModule } from 'src/loan-document/infrastructure/loan-document.module';
import { DocumentTypeModule } from 'src/document-type/infrastructure/document-type.module';
import { NotificationsModule } from 'src/notifications/infrastructure/notifications.module';

const CommandHandlers = [
  CreateLoanHandler,
  CreateLoanWithFilesHandler,
  UpdateLoanHandler,
  UpdateLoanWithFilesHandler,
  SoftDeleteLoanHandler,
];

const QueryHandlers = [
  GetLoansHandler,
  GetLoanByIdHandler,
  CalculateLoanHandler,
];

const Repositories = [LoanRepository];

const Services = [LoanCalculatorService];

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan]),
    CqrsModule,
    ClientsModule,
    OrganizationModule,
    IdentityModule,
    LoanTypeModule,
    DocumentTypeModule,
    NotificationsModule,
    forwardRef(() => LoanDocumentModule),
  ],
  controllers: [LoansController],
  providers: [
    ...Repositories,
    ...Services,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [...Repositories, ...Services, TypeOrmModule.forFeature([Loan])],
})
export class LoanModule {}
