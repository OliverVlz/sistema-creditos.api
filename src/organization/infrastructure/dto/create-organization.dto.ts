import { IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Policía Nacional' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 15.50, description: 'Base interest rate (percentage)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  baseInterestRate: number;

  @ApiProperty({ example: 2.50, description: 'Discount rate for military personnel (percentage)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  discountRate: number;

  @ApiProperty({ example: 4.50, description: 'Tax rate (percentage)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  taxRate: number;
}
