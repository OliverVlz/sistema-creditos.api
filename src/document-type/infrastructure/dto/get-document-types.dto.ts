import { IsOptional, IsString, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetDocumentTypesDto {
  @ApiProperty({ 
    description: 'Términos de búsqueda para filtrar por código, nombre o descripción', 
    required: false,
    example: 'certificado'
  })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ 
    description: 'Filtrar por estado activo/inactivo', 
    required: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ 
    description: 'Número de página para paginación', 
    required: false,
    example: 1,
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiProperty({ 
    description: 'Límite de elementos por página', 
    required: false,
    example: 10,
    default: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
