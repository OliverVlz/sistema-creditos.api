import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { GetLoansDto } from './dto/get-loans.dto';

import { CreateLoanCommand } from '../application/create-loan/create-loan.command';
import { GetLoansQuery } from '../application/get-loans/get-loans.query';
import { UpdateLoanCommand } from '../application/update-loan/update-loan.command';
import { SoftDeleteLoanCommand } from '../application/soft-delete-loan/soft-delete-loan.command';
import { GetLoanByIdQuery } from '../application/get-loan-by-id/get-loan-by-id.query';

@ApiTags('Loans')
@Controller('loans')
@ApiBearerAuth()
export class LoansController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'Create new loan' })
  async create(@Body() body: CreateLoanDto, @Req() req: any) {
    return this.commandBus.execute(new CreateLoanCommand({
      ...body,
      createdBy: req.user.id,
    }));
  }

  @Get('/')
  @ApiOperation({ summary: 'Search loans with optional filters and pagination' })
  async searchLoans(@Query() query: GetLoansDto) {
    return this.queryBus.execute(new GetLoansQuery(query));
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get loan by ID' })
  async getLoanById(@Param('id') id: string) {
    return this.queryBus.execute(new GetLoanByIdQuery(id));
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Update loan' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateLoanDto,
    @Req() req: any,
  ) {
    return this.commandBus.execute(
      new UpdateLoanCommand({ 
        id, 
        ...body, 
        updatedBy: req.user.id 
      }),
    );
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Soft delete loan' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.commandBus.execute(
      new SoftDeleteLoanCommand(id, req.user.id)
    );
  }
}
