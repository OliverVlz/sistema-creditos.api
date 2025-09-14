import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { GetDocumentTypesDto } from './dto/get-document-types.dto';

import { CreateDocumentTypeCommand } from '../application/create-document-type/create-document-type.command';
import { GetDocumentTypesQuery } from '../application/get-document-types/get-document-types.query';
import { GetDocumentTypeByIdQuery } from '../application/get-document-type-by-id/get-document-type-by-id.query';
import { UpdateDocumentTypeCommand } from '../application/update-document-type/update-document-type.command';
import { DeleteDocumentTypeCommand } from '../application/delete-document-type/delete-document-type.command';
import { GetRequiredDocumentsByClientQuery } from '../application/get-required-documents-by-client/get-required-documents-by-client.query';
import { GetDocumentRequirementsQuery } from '../application/manage-document-requirements/get-document-requirements.query';
import { CreateDocumentRequirementCommand } from '../application/manage-document-requirements/create-document-requirement.command';
import { CreateDocumentRequirementDto } from './dto/create-document-requirement.dto';

import { AdminGuard } from 'src/shared/guards';

@ApiTags('Document Types')
@Controller('document-types')
@ApiBearerAuth()
@UseGuards(AdminGuard)
export class DocumentTypesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'Create a new document type - ADMIN only' })
  async create(@Body() body: CreateDocumentTypeDto, @Req() req: any) {
    return this.commandBus.execute(new CreateDocumentTypeCommand({
      ...body,
      createdBy: req.user.id,
    }));
  }

  @Get('/')
  @ApiOperation({ summary: 'Search document types with optional filters and pagination - ADMIN only' })
  async searchDocumentTypes(@Query() query: GetDocumentTypesDto) {
    return this.queryBus.execute(new GetDocumentTypesQuery(query));
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get document type by ID - ADMIN only' })
  async getDocumentTypeById(@Param('id') id: string) {
    return this.queryBus.execute(new GetDocumentTypeByIdQuery(id));
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Update document type - ADMIN only' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDocumentTypeDto,
    @Req() req: any,
  ) {
    return this.commandBus.execute(
      new UpdateDocumentTypeCommand({ 
        id,
        ...body, 
        updatedBy: req.user.id 
      }),
    );
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Soft delete document type - ADMIN only' })
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.commandBus.execute(
      new DeleteDocumentTypeCommand(id, req.user.id)
    );
  }

  @Get('/required/:loanTypeId/:clientId')
  @ApiOperation({ summary: 'Get required documents for a specific client and loan type' })
  async getRequiredDocumentsByClient(
    @Param('loanTypeId') loanTypeId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.queryBus.execute(
      new GetRequiredDocumentsByClientQuery(loanTypeId, clientId)
    );
  }

  @Get('/requirements/:loanTypeId')
  @ApiOperation({ summary: 'Get document requirements configuration for a loan type - ADMIN only' })
  async getDocumentRequirements(@Param('loanTypeId') loanTypeId: string) {
    return this.queryBus.execute(new GetDocumentRequirementsQuery(loanTypeId));
  }

  @Post('/requirements')
  @ApiOperation({ summary: 'Add document requirement to a loan type - ADMIN only' })
  async addDocumentRequirement(
    @Body() body: CreateDocumentRequirementDto,
    @Req() req: any,
  ) {
    return this.commandBus.execute(new CreateDocumentRequirementCommand({
      ...body,
      createdBy: req.user.id,
    }));
  }
}
