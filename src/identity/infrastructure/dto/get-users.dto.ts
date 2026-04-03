import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/shared/enums';
import { PaginationDto } from 'src/shared/dto';
import { Transform } from 'class-transformer';

export class GetUsersDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: [UserRole.ADMIN, UserRole.ASESOR],
  })
  @IsOptional()
  @IsEnum(UserRole)
  @IsIn([UserRole.ADMIN, UserRole.ASESOR], {
    message: 'Solo se permite filtrar por roles ADMIN o ASESOR',
  })
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Search term for firstName, lastName, email or phone',
  })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({
    description: 'Filter by user active status (true/false)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;
}
