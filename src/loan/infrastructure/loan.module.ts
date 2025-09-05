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

const CommandHandlers = [
  CreateLoanHandler,
  UpdateLoanHandler,
  SoftDeleteLoanHandler,
];

const QueryHandlers = [
  GetLoansHandler,
  GetLoanByIdHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan]),
    CqrsModule,
  ],
  controllers: [LoansController],
  providers: [
    LoanRepository,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [LoanRepository],
})
export class LoanModule {}
