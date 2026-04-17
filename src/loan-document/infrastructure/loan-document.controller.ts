import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { LoanDocumentRepository } from './repositories/loan-document.repository';

import { CreateLoanDocumentDto } from './dto/create-loan-document.dto';
import { CreateLoanDocumentsBatchDto } from './dto/create-loan-documents-batch.dto';
import { UpdateLoanDocumentDto } from './dto/update-loan-document.dto';
import { UpdateLoanDocumentsBatchDto } from './dto/update-loan-documents-batch.dto';

import { CreateLoanDocumentCommand } from '../application/create-loan-document/create-loan-document.command';
import { CreateLoanDocumentsBatchCommand } from '../application/create-loan-documents-batch/create-loan-documents-batch.command';
import { UpdateLoanDocumentCommand } from '../application/update-loan-document/update-loan-document.command';
import { UpdateLoanDocumentsBatchCommand } from '../application/update-loan-documents-batch/update-loan-documents-batch.command';
import { DeleteLoanDocumentCommand } from '../application/delete-loan-document/delete-loan-document.command';
import { GetLoanDocumentByIdQuery } from '../application/get-loan-document-by-id/get-loan-document-by-id.query';
import { GetLoanDocumentsByLoanQuery } from '../application/get-loan-documents-by-loan/get-loan-documents-by-loan.query';

import { AdminGuard } from 'src/shared/guards';
import { StorageService } from 'src/storage/infrastructure/storage.service';

@ApiTags('Loan Documents')
@Controller('loan-documents')
@ApiBearerAuth()
@UseGuards(AdminGuard)
export class LoanDocumentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly loanDocumentRepository: LoanDocumentRepository,
    private readonly storageService: StorageService,
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'Crear un nuevo documento de préstamo' })
  async create(@Body() body: CreateLoanDocumentDto) {
    return this.commandBus.execute(new CreateLoanDocumentCommand({ ...body }));
  }

  @Post('/batch')
  @ApiOperation({ summary: 'Crear múltiples documentos para un préstamo' })
  async createBatch(@Body() body: CreateLoanDocumentsBatchDto) {
    return this.commandBus.execute(
      new CreateLoanDocumentsBatchCommand({ ...body }),
    );
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

  @Get('/:id/download')
  @ApiOperation({ summary: 'Descargar documento por ID' })
  async download(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const document = await this.loanDocumentRepository.findOne(id);

    try {
      const file = await this.storageService.getObjectForDownload(document.url);
      res.setHeader('Content-Type', file.contentType || 'application/pdf');
      if (typeof file.contentLength === 'number') {
        res.setHeader('Content-Length', `${file.contentLength}`);
      }
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(file.fileName)}"`,
      );

      file.stream.on('error', () => {
        if (!res.headersSent) {
          res.status(500).send('Error al leer el archivo');
        } else {
          res.end();
        }
      });

      file.stream.pipe(res);
    } catch {
      throw new InternalServerErrorException('No se pudo descargar el archivo');
    }
  }

  @Patch('/batch')
  @ApiOperation({ summary: 'Actualizar múltiples documentos' })
  async updateBatch(@Body() body: UpdateLoanDocumentsBatchDto) {
    return this.commandBus.execute(
      new UpdateLoanDocumentsBatchCommand({ ...body }),
    );
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Reemplazar documento (actualizar URL)' })
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
