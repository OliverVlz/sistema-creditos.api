import { IsEnum, IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { EmploymentStatus } from 'src/shared/enums';

export class CreateClientDto {
  @ApiProperty({ description: 'ID del usuario existente' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Document number', example: '123456789' })
  @IsNotEmpty()
  @IsString()
  documentNumber: string;

  @ApiProperty({ description: 'Phone number', example: '555-123-4567' })
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Client address', example: '123 Main St' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Client birth date (YYYY-MM-DD)', example: '1990-01-01' })
  @IsNotEmpty()
  @IsDateString()
  birthDate: Date;

  @ApiProperty({ description: 'Employment status' })
  @IsNotEmpty()
  @IsEnum(EmploymentStatus)
  employmentStatus: EmploymentStatus;
}
