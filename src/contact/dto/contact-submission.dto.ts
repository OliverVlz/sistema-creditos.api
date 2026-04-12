import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ContactSubmissionDto {
  @ApiProperty({ example: 'María Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre: string;

  @ApiProperty({ example: '3158008588' })
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  @Matches(/^[0-9+\-\s()]+$/, {
    message: 'El teléfono solo puede incluir dígitos y símbolos telefónicos',
  })
  telefono: string;

  @ApiPropertyOptional({ example: 'correo@ejemplo.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  mensaje?: string;
}
