import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/shared/enums';
import { PaginationDto } from 'src/shared/dto';

export class GetUsersDto extends PaginationDto {
  @ApiPropertyOptional({ 
    description: 'Filter by user role',
    enum: UserRole
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Search term for firstName, lastName, email or phone' })
  @IsOptional()
  @IsString()
  terms?: string;
} 