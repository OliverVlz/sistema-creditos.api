import { IsUUID, IsNumber, Min, Max, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'Monto solicitado del préstamo', example: 1000.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amountRequested: number;

  @ApiProperty({ description: 'Tasa de interés del préstamo', example: 0.05 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  interestRate: number; // Reintroducido

  @ApiProperty({ description: 'Plazo del préstamo en meses', example: 12 })
  @IsNumber()
  @Min(1)
  termMonths: number;

  @ApiProperty({ description: 'Pago mensual estimado', example: 100.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monthlyPayment: number;

  @ApiPropertyOptional({ description: 'Notas adicionales', example: 'Préstamo para educación' })
  @IsOptional()
  @IsString()
  notes?: string;
}
