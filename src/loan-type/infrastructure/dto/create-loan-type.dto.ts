import { IsNotEmpty, IsString, IsNumber, Min, Max, IsBoolean, IsArray, ArrayMinSize, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanTypeDto {
  @ApiProperty({ description: 'Nombre del tipo de préstamo', example: 'Préstamo Personal' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descripción del tipo de préstamo', example: 'Préstamo de libre inversión' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Tasa base de comisión por procesamiento (decimal)', example: 0.02 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1)
  baseProcessingFee: number;

  @ApiProperty({ description: 'Monto máximo permitido para este tipo de préstamo', example: 50000.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxAmount: number;

  @ApiProperty({ description: 'Monto mínimo permitido para este tipo de préstamo', example: 1000.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minAmount: number;

  @ApiProperty({ description: 'Plazo máximo en meses para este tipo de préstamo', example: 60 })
  @IsNumber()
  @Min(1)
  maxTermMonths: number;

  @ApiProperty({ description: 'Indica si el tipo de préstamo está activo', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Tipos de documentos requeridos para este tipo de préstamo', example: ['uuid-cedula', 'uuid-nomina'] })
  @IsArray()
  @IsUUID('4', { each: true }) // Validar cada elemento como UUID v4
  @ArrayMinSize(0) // Permitir un array vacío si no se requieren documentos específicos
  @IsOptional()
  requiredDocumentTypes?: string[];
}



