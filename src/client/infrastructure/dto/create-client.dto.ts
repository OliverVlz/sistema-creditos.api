import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ description: 'ID del usuario existente' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @ApiPropertyOptional({ 
    description: 'Puntaje crediticio',
    example: 750 
  })
  @IsOptional()
  @IsNumber()
  creditScore?: number;

  @ApiPropertyOptional({ 
    description: 'Límite máximo de crédito',
    example: 50000 
  })
  @IsOptional()
  @IsNumber()
  maxCreditLimit?: number;

  @ApiPropertyOptional({ 
    description: 'Nivel de riesgo',
    example: 'LOW' 
  })
  @IsOptional()
  @IsString()
  riskLevel?: string;
}
