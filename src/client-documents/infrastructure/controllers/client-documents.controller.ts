import { Controller, Get, Post, Patch, Param, Query, Req, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ValidateRequiredDocumentsQuery } from '../../application/validate-required-documents/validate-required-documents.query';
import { ClientGuard } from 'src/shared/guards';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@ApiTags('Client Documents')
@Controller('client-documents')
@ApiBearerAuth()
@UseGuards(ClientGuard)
export class ClientDocumentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('/validate-required/:loanTypeId')
  @ApiOperation({ summary: 'Validate if client has all required documents for a loan type' })
  async validateRequiredDocuments(
    @Param('loanTypeId') loanTypeId: string,
    @Req() req: any,
  ) {
    return this.queryBus.execute(
      new ValidateRequiredDocumentsQuery(loanTypeId, req.user.id)
    );
  }

  @Post('/upload')
  @ApiOperation({ summary: 'Upload a document for the authenticated client' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: MulterFile,
    @Req() req: any,
  ) {
    // TODO: Implementar upload de documentos
    return {
      message: 'Document upload endpoint - to be implemented',
      file: file?.originalname,
      clientId: req.user.id
    };
  }

  @Get('/')
  @ApiOperation({ summary: 'Get all documents for the authenticated client' })
  async getClientDocuments(
    @Req() req: any,
    @Query('status') status?: string,
  ) {
    // TODO: Implementar listado de documentos
    return {
      message: 'Get client documents endpoint - to be implemented',
      clientId: req.user.id,
      status
    };
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get a specific document by ID' })
  async getDocumentById(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    // TODO: Implementar obtener documento por ID
    return {
      message: 'Get document by ID endpoint - to be implemented',
      documentId: id,
      clientId: req.user.id
    };
  }
}
