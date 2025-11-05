import { IsNotEmpty, IsString, IsEmail, MinLength, Matches, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/shared/enums';

export class CreateStaffUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'admin@sistema.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Admin123456!' })
  @IsString()
  @MinLength(6)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas y números',
  })
  password: string;

  @ApiProperty({ description: 'Número de documento (Cédula, DNI, etc.)', example: '123456789' })
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @ApiProperty({ description: 'Número de teléfono (opcional)', example: '+573001234567', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ 
    description: 'Role del usuario staff',
    example: UserRole.ASESOR,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
