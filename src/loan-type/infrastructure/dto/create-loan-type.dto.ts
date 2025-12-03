import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLoanTypeDto {
  @ApiProperty({
    description: 'Nombre del tipo de préstamo',
    example: 'Libranza',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del tipo de préstamo',
    example: 'Préstamo por descuento de nómina',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tasa de interés anual (%)',
    example: 25,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  interestRate: number;

  @ApiProperty({ description: 'Monto mínimo permitido', example: 500000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount: number;

  @ApiProperty({ description: 'Monto máximo permitido', example: 20000000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount: number;

  @ApiProperty({ description: 'Plazo mínimo en meses', example: 6 })
  @IsNumber()
  @Min(1)
  minTerm: number;

  @ApiProperty({ description: 'Plazo máximo en meses', example: 60 })
  @IsNumber()
  @Min(1)
  maxTerm: number;

  @ApiPropertyOptional({
    description: 'Indica si el tipo de préstamo está activo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'IDs de los tipos de documentos requeridos',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  requiredDocumentTypeIds?: string[];
}
