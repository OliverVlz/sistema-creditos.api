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

import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

import { CreateDocumentTypeCommand } from '../application/create-document-type/create-document-type.command';
import { GetDocumentTypesQuery } from '../application/get-document-types/get-document-types.query';
import { GetDocumentTypeByIdQuery } from '../application/get-document-type-by-id/get-document-type-by-id.query';
import { UpdateDocumentTypeCommand } from '../application/update-document-type/update-document-type.command';
import { DeleteDocumentTypeCommand } from '../application/delete-document-type/delete-document-type.command';

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
  @ApiOperation({ summary: 'Crear un nuevo tipo de documento - Solo ADMIN' })
  async create(@Body() body: CreateDocumentTypeDto) {
    return this.commandBus.execute(new CreateDocumentTypeCommand({ ...body }));
  }

  @Get('/')
  @ApiOperation({ summary: 'Obtener todos los tipos de documento - Solo ADMIN' })
  async findAll() {
    return this.queryBus.execute(new GetDocumentTypesQuery());
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Obtener tipo de documento por ID - Solo ADMIN' })
  async findOne(@Param('id') id: string) {
    return this.queryBus.execute(new GetDocumentTypeByIdQuery(id));
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Actualizar tipo de documento - Solo ADMIN' })
  async update(@Param('id') id: string, @Body() body: UpdateDocumentTypeDto) {
    return this.commandBus.execute(
      new UpdateDocumentTypeCommand({ id, ...body }),
    );
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Eliminar tipo de documento (soft delete) - Solo ADMIN' })
  async remove(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteDocumentTypeCommand(id));
  }
}
