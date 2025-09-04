import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateOrganizationDto } from './dto/create-organization.dto';
import { GetOrganizationDto } from './dto/get-organization.dto';

import { GetOrganizationsQuery } from '../application/get-organizations/get-organizations.query';

@ApiTags('Organizations')
@Controller('organizations')
@ApiBearerAuth()
export class OrganizationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('/')
  @ApiOperation({ summary: 'Search organizations with optional filters and pagination' })
  async searchOrganizations(@Query() query: GetOrganizationDto) {
    return this.queryBus.execute(new GetOrganizationsQuery(query));
  }
}
