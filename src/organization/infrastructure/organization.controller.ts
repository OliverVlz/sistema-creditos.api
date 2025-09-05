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

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { GetOrganizationDto } from './dto/get-organization.dto';

import { CreateOrganizationCommand } from '../application/create-organization/create-organization.command';
import { GetOrganizationsQuery } from '../application/get-organizations/get-organizations.query';
import { GetOrganizationByIdQuery } from '../application/get-organization-by-id/get-organization-by-id.query';
import { UpdateOrganizationCommand } from '../application/update-organization/update-organization.command';
import { DeleteOrganizationCommand } from '../application/delete-organization/delete-organization.command';

@ApiTags('Organizations')
@Controller('organizations')
@ApiBearerAuth()
export class OrganizationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'Create new organization' })
  async create(@Body() body: CreateOrganizationDto, @Req() req: any) {
    return this.commandBus.execute(new CreateOrganizationCommand({
      ...body,
      createdBy: req.user.id,
    }));
  }

  @Get('/')
  @ApiOperation({ summary: 'Search organizations with optional filters and pagination' })
  async searchOrganizations(@Query() query: GetOrganizationDto) {
    return this.queryBus.execute(new GetOrganizationsQuery(query));
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get organization by ID' })
  async getOrganizationById(@Param('id') id: string) {
    return this.queryBus.execute(new GetOrganizationByIdQuery(id));
  }

  @Patch('/:id')
  @ApiOperation({ summary: 'Update organization' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateOrganizationDto,
    @Req() req: any,
  ) {
    return this.commandBus.execute(
      new UpdateOrganizationCommand({ 
        id, 
        ...body, 
        updatedBy: req.user.id 
      }),
    );
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete organization' })
  async remove(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteOrganizationCommand(id));
  }
}
