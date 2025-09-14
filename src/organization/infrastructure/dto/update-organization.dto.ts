import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @ApiPropertyOptional({ description: 'Indica si la organización está activa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
