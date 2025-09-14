import { IsOptional, IsString, IsNumberString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';
import { Transform } from 'class-transformer';

export class GetLoanTypesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Términos de búsqueda (nombre, descripción)' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Filtrar por si está activo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;
}



