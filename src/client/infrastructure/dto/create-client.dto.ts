import { IsNotEmpty, IsString, IsOptional, IsEmail, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateClientDto {
  @ApiProperty({ description: 'First name of the client' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name of the client' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Document number (unique identifier)' })
  @IsNotEmpty()
  @IsString()
  documentNumber: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Physical address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsString()
  organizationId: string;
}
