import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from 'src/shared/enums';

export class GetUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
} 