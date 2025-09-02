import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@pos.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin123456!' })
  @IsString()
  @MinLength(6)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe incluir mayúsculas, minúsculas y números',
  })
  password: string;
}
