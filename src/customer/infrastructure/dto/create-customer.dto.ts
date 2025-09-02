import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan Pérez García' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: '12345678' })
  @IsNotEmpty()
  @IsString()
  documentNumber: string;

  @ApiProperty({ example: '3001234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Calle 123 #45-67', required: false })
  @IsOptional()
  @IsString()
  address?: string;
} 