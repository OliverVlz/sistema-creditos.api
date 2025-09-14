import { IsOptional, IsString, IsNumberString, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/dto';
import { Transform } from 'class-transformer';
import { LoanStatus } from '../entity/loan.entity';

export class GetLoansDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'ID del cliente para filtrar' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'ID del tipo de préstamo para filtrar' })
  @IsOptional()
  @IsUUID()
  loanTypeId?: string;

  @ApiPropertyOptional({ description: 'ID de la organización para filtrar' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Número de préstamo para filtrar' })
  @IsOptional()
  @IsString()
  loanNumber?: string;

  @ApiPropertyOptional({ description: 'Estado del préstamo para filtrar', enum: LoanStatus })
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @ApiPropertyOptional({ description: 'Términos de búsqueda (número de préstamo, notas, etc.)' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Filtrar por si está activo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;
}
