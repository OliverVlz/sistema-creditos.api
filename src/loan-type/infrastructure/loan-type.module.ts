import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

import { LoanType } from './entity/loan-type.entity';
import { LoanTypesController } from './loan-types.controller';
import { LoanTypeRepository } from './repositories/loan-type.repository';

import { CreateLoanTypeHandler } from '../application/create-loan-type/create-loan-type.handler';
import { GetLoanTypesHandler } from '../application/get-loan-types/get-loan-types.handler';
import { GetLoanTypeByIdHandler } from '../application/get-loan-type-by-id/get-loan-type-by-id.handler';
import { UpdateLoanTypeHandler } from '../application/update-loan-type/update-loan-type.handler';
import { DeleteLoanTypeHandler } from '../application/delete-loan-type/delete-loan-type.handler';

const CommandHandlers = [
  CreateLoanTypeHandler,
  UpdateLoanTypeHandler,
  DeleteLoanTypeHandler,
];

const QueryHandlers = [
  GetLoanTypesHandler,
  GetLoanTypeByIdHandler,
];

const Repositories = [
  LoanTypeRepository,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanType]),
    CqrsModule,
  ],
  controllers: [LoanTypesController],
  providers: [
    ...Repositories,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    ...Repositories,
    TypeOrmModule.forFeature([LoanType]),
  ],
})
export class LoanTypeModule {}
