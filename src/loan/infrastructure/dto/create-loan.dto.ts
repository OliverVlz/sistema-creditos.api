import {
  IsUUID,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class DocumentItemDto {
  @ApiProperty({
    description: 'Código del tipo de documento',
    example: 'CEDULA',
  })
  @IsNotEmpty()
  @IsString()
  documentTypeCode: string;

  @ApiProperty({
    description: 'URL del documento',
    example: 'https://storage.example.com/docs/file.pdf',
  })
  @IsNotEmpty()
  @IsString()
  url: string;
}

export class CreateLoanDto {
  @ApiProperty({ description: 'ID del cliente' })
  @IsUUID()
  clientId: string;

  @ApiProperty({
    description: 'Nombre del tipo de préstamo (único)',
    example: 'Libranza',
  })
  @IsNotEmpty()
  @IsString()
  loanTypeName: string;

  @ApiProperty({
    description: 'Nombre de la organización (único)',
    example: 'Policía Nacional',
  })
  @IsNotEmpty()
  @IsString()
  organizationName: string;

  @ApiProperty({
    description: 'Monto solicitado del préstamo',
    example: 2000000,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountRequested: number;

  @ApiProperty({ description: 'Plazo del préstamo en meses', example: 24 })
  @IsNumber()
  @Min(1)
  termMonths: number;

  @ApiProperty({
    description: 'Pago mensual calculado por el frontend',
    example: 104273.38,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyPayment: number;

  @ApiProperty({
    description: 'Total de intereses calculado por el frontend',
    example: 502561,
  })
  @IsNumber()
  @Min(0)
  totalInterest: number;

  @ApiProperty({
    description:
      'Total a pagar calculado por el frontend (monthlyPayment × termMonths)',
    example: 2502561,
  })
  @IsNumber()
  @Min(0)
  totalPayable: number;

  @ApiProperty({
    description: 'Documentos del préstamo (opcional)',
    type: [DocumentItemDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentItemDto)
  documents?: DocumentItemDto[];
}
