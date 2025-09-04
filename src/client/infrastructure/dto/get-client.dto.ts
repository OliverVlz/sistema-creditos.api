import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';

export class GetClientDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term for fullName, documentNumber or phone' })
  @IsOptional()
  @IsString()
  terms?: string;
}
