import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanDto {
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
    example: 502561.12,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalInterest: number;

  @ApiProperty({
    description: 'Total a pagar calculado por el frontend (monthlyPayment × termMonths)',
    example: 2502561.12,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalPayable: number;
}
