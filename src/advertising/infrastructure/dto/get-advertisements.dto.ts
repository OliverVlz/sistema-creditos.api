import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/shared/dto';

export class GetAdvertisementsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Búsqueda por título' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Filtrar por estado activo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;
}
