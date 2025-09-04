import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';

export class GetOrganizationDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for organization name' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  isActive?: boolean;
}
