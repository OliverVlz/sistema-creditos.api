import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateLoanDto {
  @ApiProperty({ description: 'Client ID' })
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Loan amount' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ description: 'Interest rate (percentage)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  interestRate: number;

  @ApiProperty({ description: 'Term in months' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  termMonths: number;

  @ApiPropertyOptional({ description: 'Start date of the loan' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
