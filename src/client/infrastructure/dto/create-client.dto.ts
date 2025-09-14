import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { EmploymentStatus } from 'src/shared/enums';

export class CreateClientDto {
  @ApiProperty({ description: 'ID del usuario existente' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsString()
  organizationId: string;

  @ApiProperty({ description: 'Employment status' })
  @IsNotEmpty()
  @IsEnum(EmploymentStatus)
  employmentStatus: EmploymentStatus;
}
