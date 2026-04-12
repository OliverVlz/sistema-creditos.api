import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class BulkImportClientsLoansDto {
  @ApiPropertyOptional({
    description: 'Cantidad de filas a procesar por lote',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  chunkSize: number = 20;
}
