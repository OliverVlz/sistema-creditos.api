import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateLoanDto {
  @ApiProperty({ description: 'ID del tipo de préstamo' })
  @IsUUID()
  loanTypeId: string;

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
}



