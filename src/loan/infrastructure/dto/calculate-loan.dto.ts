import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateLoanDto {
  @ApiProperty({
    description: 'Nombre del tipo de préstamo (único)',
    example: 'Libranza',
  })
  @IsNotEmpty()
  @IsString()
  loanTypeName: string;

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



