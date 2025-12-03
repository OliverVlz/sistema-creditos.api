import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateLoanDocumentDto } from './dto/create-loan-document.dto';
import { UpdateLoanDocumentDto } from './dto/update-loan-document.dto';

import { CreateLoanDocumentCommand } from '../application/create-loan-document/create-loan-document.command';
import { UpdateLoanDocumentCommand } from '../application/update-loan-document/update-loan-document.command';
import { DeleteLoanDocumentCommand } from '../application/delete-loan-document/delete-loan-document.command';
import { GetLoanDocumentByIdQuery } from '../application/get-loan-document-by-id/get-loan-document-by-id.query';
import { GetLoanDocumentsByLoanQuery } from '../application/get-loan-documents-by-loan/get-loan-documents-by-loan.query';

import { AdminGuard } from 'src/shared/guards';

@ApiTags('Loan Documents')
@Controller('loan-documents')
@ApiBearerAuth()
@UseGuards(AdminGuard)
export class LoanDocumentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'Crear un nuevo documento de préstamo' })
  async create(@Body() body: CreateLoanDocumentDto) {
    return this.commandBus.execute(new CreateLoanDocumentCommand({ ...body }));
  }

  @Get('/loan/:loanId')
  @ApiOperation({ summary: 'Obtener documentos por préstamo' })
  async findByLoan(@Param('loanId') loanId: string) {
    return this.queryBus.execute(new GetLoanDocumentsByLoanQuery(loanId));
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obtener documento por ID' })
  async findOne(@Param('id') id: string) {
    return this.queryBus.execute(new GetLoanDocumentByIdQuery(id));
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Actualizar documento' })
  async update(@Param('id') id: string, @Body() body: UpdateLoanDocumentDto) {
    return this.commandBus.execute(
      new UpdateLoanDocumentCommand({ id, ...body }),
    );
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Eliminar documento' })
  async remove(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteLoanDocumentCommand(id));
  }
}

