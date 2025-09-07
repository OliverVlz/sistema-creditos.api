import { IsNotEmpty, IsString, IsEmail, MinLength, Matches, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/shared/enums/user-role.enum';

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

  @ApiProperty({ 
    enum: [UserRole.ADMIN, UserRole.ADVISOR], 
    description: 'Role del usuario staff',
    example: UserRole.ADVISOR 
  })
  @IsEnum([UserRole.ADMIN, UserRole.ADVISOR])
  role: UserRole;
}
