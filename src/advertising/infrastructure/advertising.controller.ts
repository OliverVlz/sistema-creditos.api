import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/shared/validation';
import { AdminOrAdvisorGuard } from 'src/shared/guards';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { GetAdvertisementsDto } from './dto/get-advertisements.dto';
import { ReorderAdvertisementsDto } from './dto/reorder-advertisements.dto';
import { CreateAdvertisementCommand } from '../application/create-advertisement/create-advertisement.command';
import { UpdateAdvertisementCommand } from '../application/update-advertisement/update-advertisement.command';
import { SetAdvertisementStatusCommand } from '../application/set-advertisement-status/set-advertisement-status.command';
import { ReorderAdvertisementsCommand } from '../application/reorder-advertisements/reorder-advertisements.command';
import { DeleteAdvertisementCommand } from '../application/delete-advertisement/delete-advertisement.command';
import { GetAdvertisementsQuery } from '../application/get-advertisements/get-advertisements.query';
import { GetPublicAdvertisementsQuery } from '../application/get-public-advertisements/get-public-advertisements.query';

const MAX_ADVERTISEMENT_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ADVERTISEMENT_IMAGE_FILE_TYPE = /image\/(jpeg|jpg|png|webp)/;

@ApiTags('Advertisements')
@Controller('advertisements')
@ApiBearerAuth()
export class AdvertisingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  @UseGuards(AdminOrAdvisorGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_ADVERTISEMENT_IMAGE_SIZE_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        targetUrl: { type: 'string' },
        isRedirectEnabled: { type: 'boolean' },
        isActive: { type: 'boolean' },
        sortOrder: { type: 'number' },
        startsAt: { type: 'string', format: 'date-time' },
        endsAt: { type: 'string', format: 'date-time' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['title', 'image'],
    },
  })
  @ApiOperation({ summary: 'Crear publicidad con imagen' })
  async create(
    @Body() body: CreateAdvertisementDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: ADVERTISEMENT_IMAGE_FILE_TYPE })
        .addMaxSizeValidator({ maxSize: MAX_ADVERTISEMENT_IMAGE_SIZE_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
    )
    image: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.commandBus.execute(
      new CreateAdvertisementCommand(body, image, req.user?.id),
    );
  }

  @Get('/')
  @UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({ summary: 'Listar publicidad con filtros y paginación' })
  async getAll(@Query() query: GetAdvertisementsDto) {
    return this.queryBus.execute(new GetAdvertisementsQuery(query));
  }

  @Get('/public/landing')
  @Public()
  @ApiOperation({ summary: 'Listar publicidad activa para la landing' })
  async getPublicLanding(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit);
    const safeLimit = Number.isNaN(parsedLimit) || parsedLimit <= 0 ? 20 : parsedLimit;
    return this.queryBus.execute(new GetPublicAdvertisementsQuery(safeLimit));
  }

  @Patch('/reorder')
  @UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({ summary: 'Reordenar publicidad para carrusel' })
  async reorder(@Body() body: ReorderAdvertisementsDto, @Req() req: any) {
    return this.commandBus.execute(
      new ReorderAdvertisementsCommand(body.items, req.user?.id),
    );
  }

  @Patch('/:id')
  @UseGuards(AdminOrAdvisorGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_ADVERTISEMENT_IMAGE_SIZE_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        targetUrl: { type: 'string' },
        isRedirectEnabled: { type: 'boolean' },
        isActive: { type: 'boolean' },
        sortOrder: { type: 'number' },
        startsAt: { type: 'string', format: 'date-time' },
        endsAt: { type: 'string', format: 'date-time' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Actualizar publicidad o reemplazar imagen' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateAdvertisementDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: ADVERTISEMENT_IMAGE_FILE_TYPE })
        .addMaxSizeValidator({ maxSize: MAX_ADVERTISEMENT_IMAGE_SIZE_BYTES })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    image: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.commandBus.execute(
      new UpdateAdvertisementCommand(id, body, image, req.user?.id),
    );
  }

  @Post('/:id/activate')
  @UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({ summary: 'Activar publicidad' })
  async activate(@Param('id') id: string, @Req() req: any) {
    return this.commandBus.execute(
      new SetAdvertisementStatusCommand(id, true, req.user?.id),
    );
  }

  @Post('/:id/deactivate')
  @UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({ summary: 'Desactivar publicidad' })
  async deactivate(@Param('id') id: string, @Req() req: any) {
    return this.commandBus.execute(
      new SetAdvertisementStatusCommand(id, false, req.user?.id),
    );
  }

  @Delete('/:id')
  @UseGuards(AdminOrAdvisorGuard)
  @ApiOperation({ summary: 'Eliminar publicidad' })
  async delete(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteAdvertisementCommand(id));
  }

}
