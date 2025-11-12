import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmploymentStatus } from 'src/shared/enums';

export class UpdateClientProfileDto {
  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'Juan',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Apellido del cliente',
    example: 'Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Av. Principal 123, Apto 5B',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Número de teléfono del cliente',
    example: '+58 412-1234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Fecha de nacimiento del cliente',
    example: '1990-05-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({
    description: 'Estado laboral del cliente',
    enum: EmploymentStatus,
    example: EmploymentStatus.ACTIVO,
    required: false,
  })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @ApiProperty({
    description: 'ID de la organización a la que pertenece el cliente',
    required: false,
  })
  @IsOptional()
  @IsString()
  organizationId?: string;
}
