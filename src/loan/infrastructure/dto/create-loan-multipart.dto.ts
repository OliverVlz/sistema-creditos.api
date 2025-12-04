import {
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateLoanMultipartDto {
  @ApiProperty({ description: 'ID del cliente' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'ID del tipo de préstamo' })
  @IsUUID()
  loanTypeId: string;

  @ApiProperty({ description: 'ID de la organización' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({
    description: 'Monto solicitado del préstamo',
    example: 2000000,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountRequested: number;

  @ApiProperty({ description: 'Plazo del préstamo en meses', example: 24 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  termMonths: number;

  @ApiProperty({
    description: 'Pago mensual calculado por el frontend',
    example: 104273.38,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyPayment: number;

  @ApiProperty({
    description: 'Total de intereses calculado por el frontend',
    example: 502561,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  totalInterest: number;

  @ApiProperty({
    description: 'Total a pagar calculado por el frontend',
    example: 2502561,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  totalPayable: number;

  @ApiProperty({
    description:
      'Códigos de tipos de documento para cada archivo (en el mismo orden que los archivos). JSON array string.',
    example: '["CEDULA", "COMPROBANTE_INGRESOS", "RECIBO_SERVICIO"]',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map(s => s.trim());
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  documentTypeCodes?: string[];
}
