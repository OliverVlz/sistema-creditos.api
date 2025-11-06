import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsDateString,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmploymentStatus } from 'src/shared/enums';

export class CreateClientUserDto {
  // Propiedades del User
  @ApiProperty({
    description: 'Email del usuario',
    example: 'cliente@dev.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 8 caracteres)',
    example: 'Pass123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Nombre del usuario', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  // Propiedades del Client
  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Calle Falsa 123',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'Fecha de nacimiento del cliente (YYYY-MM-DD)',
    example: '1990-01-01',
  })
  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @ApiProperty({
    description: 'Número de documento del cliente (Cédula, DNI, etc.)',
    example: '123456789',
    uniqueItems: true,
  })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({
    description: 'Número de teléfono del cliente (opcional)',
    example: '+573001234567',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Estado de empleo del cliente',
    enum: EmploymentStatus,
    example: EmploymentStatus.ACTIVO,
  })
  @IsEnum(EmploymentStatus)
  @IsNotEmpty()
  employmentStatus: EmploymentStatus;

  @ApiProperty({
    description: 'ID de la organización a la que pertenece el cliente',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;
}
