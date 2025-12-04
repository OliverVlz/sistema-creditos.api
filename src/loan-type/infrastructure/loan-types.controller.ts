import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateLoanTypeDto } from './dto/create-loan-type.dto';
import { UpdateLoanTypeDto } from './dto/update-loan-type.dto';
import { GetLoanTypesDto } from './dto/get-loan-types.dto';

import { CreateLoanTypeCommand } from '../application/create-loan-type/create-loan-type.command';
import { GetLoanTypesQuery } from '../application/get-loan-types/get-loan-types.query';
import { GetLoanTypeByIdQuery } from '../application/get-loan-type-by-id/get-loan-type-by-id.query';
import { UpdateLoanTypeCommand } from '../application/update-loan-type/update-loan-type.command';
import { DeleteLoanTypeCommand } from '../application/delete-loan-type/delete-loan-type.command';

import { AdminGuard } from 'src/shared/guards';
import { Public } from 'src/shared/validation';

@ApiTags('Loan Types')
@Controller('loan-types')
@ApiBearerAuth()

export class LoanTypesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  @UseGuards(AdminGuard) 
  @ApiOperation({ summary: 'Create a new loan type - ADMIN only' })
  async create(@Body() body: CreateLoanTypeDto) {
    return this.commandBus.execute(new CreateLoanTypeCommand(body));
  }

  @Get('/')
  @Public()
  @ApiOperation({ summary: 'Search loan types with optional filters and pagination - ADMIN only' })
  async searchLoanTypes(@Query() query: GetLoanTypesDto) {
    return this.queryBus.execute(new GetLoanTypesQuery(query));
  }

  @Get('/:id')
  @Public()
  @ApiOperation({ summary: 'Get loan type by ID - ADMIN only' })
  async getLoanTypeById(@Param('id') id: string) {
    return this.queryBus.execute(new GetLoanTypeByIdQuery(id));
  }

  @Patch('/:id')
  @UseGuards(AdminGuard) 
  @ApiOperation({ summary: 'Update loan type - ADMIN only' })
  async update(@Param('id') id: string, @Body() body: UpdateLoanTypeDto) {
    return this.commandBus.execute(
      new UpdateLoanTypeCommand({
        id,
        ...body,
      }),
    );
  }

  @Delete('/:id')
  @UseGuards(AdminGuard) 
  @ApiOperation({ summary: 'Soft delete loan type - ADMIN only' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.commandBus.execute(
      new DeleteLoanTypeCommand(id, req.user.id)
    );
  }
}



