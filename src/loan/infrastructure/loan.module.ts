import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

import { Loan } from './entity/loan.entity';
import { LoansController } from './loan.controller';
import { LoanRepository } from './repositories/loan.repository';

import { CreateLoanHandler } from '../application/create-loan/create-loan.handler';
import { GetLoansHandler } from '../application/get-loans/get-loans.handler';
import { GetLoanByIdHandler } from '../application/get-loan-by-id/get-loan-by-id.handler';
import { UpdateLoanHandler } from '../application/update-loan/update-loan.handler';
import { SoftDeleteLoanHandler } from '../application/soft-delete-loan/soft-delete-loan.handler';

// Importar módulos de otras entidades
import { ClientsModule } from 'src/client/infrastructure/client.module';
import { OrganizationModule } from 'src/organization/infrastructure/organization.module';
import { IdentityModule } from 'src/identity/infrastructure/identity.module';
import { LoanTypeModule } from 'src/loan-type/infrastructure/loan-type.module';

const CommandHandlers = [
  CreateLoanHandler,
  UpdateLoanHandler,
  SoftDeleteLoanHandler,
];

const QueryHandlers = [
  GetLoansHandler,
  GetLoanByIdHandler,
];

const Repositories = [
  LoanRepository,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan]),
    CqrsModule,
    ClientsModule,
    OrganizationModule,
    IdentityModule,
    LoanTypeModule,
  ],
  controllers: [LoansController],
  providers: [
    ...Repositories,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    ...Repositories,
    TypeOrmModule.forFeature([Loan]),
  ],
})
export class LoanModule {}
