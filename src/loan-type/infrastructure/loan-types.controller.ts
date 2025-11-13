import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
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

@ApiTags('Loan Types')
@Controller('loan-types')
@ApiBearerAuth()
@UseGuards(AdminGuard) // Todos los endpoints de LoanType serán solo para ADMIN
export class LoanTypesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'Create a new loan type - ADMIN only' })
  async create(@Body() body: CreateLoanTypeDto, @Req() req: any) {
    return this.commandBus.execute(new CreateLoanTypeCommand({
      ...body,
    }));
  }

  @Get('/')
  @ApiOperation({ summary: 'Search loan types with optional filters and pagination - ADMIN only' })
  async searchLoanTypes(@Query() query: GetLoanTypesDto) {
    return this.queryBus.execute(new GetLoanTypesQuery(query));
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get loan type by ID - ADMIN only' })
  async getLoanTypeById(@Param('id') id: string) {
    return this.queryBus.execute(new GetLoanTypeByIdQuery(id));
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Update loan type - ADMIN only' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateLoanTypeDto,
    @Req() req: any,
  ) {
    return this.commandBus.execute(
      new UpdateLoanTypeCommand({ 
        id,
        ...body, 
        updatedBy: req.user.id 
      }),
    );
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Soft delete loan type - ADMIN only' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.commandBus.execute(
      new DeleteLoanTypeCommand(id, req.user.id)
    );
  }
}



