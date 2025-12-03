import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @ApiPropertyOptional({ description: 'Indica si la organización está activa' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
