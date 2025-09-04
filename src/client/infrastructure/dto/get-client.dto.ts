import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';

export class GetClientDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for fullName, documentNumber or phone' })
  @IsOptional()
  @IsString()
  terms?: string;

  // Legacy cursor-based parameters (mantener compatibilidad)
  @ApiPropertyOptional({ description: 'Legacy: Cursor for pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Legacy: Page size for cursor-based pagination' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  size?: number;
}
