import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiProperty({ example: 750, required: false, description: 'Credit score (300-850)' })
  @IsOptional()
  @IsNumber()
  creditScore?: number;

  @ApiProperty({ example: 50000.00, required: false, description: 'Maximum credit limit' })
  @IsOptional()
  @IsNumber()
  maxCreditLimit?: number;

  @ApiProperty({ example: 'LOW', required: false, description: 'Risk level: LOW, MEDIUM, HIGH' })
  @IsOptional()
  @IsString()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  riskLevel?: string;
}
