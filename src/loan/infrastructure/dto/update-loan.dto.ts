import { IsUUID, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LoanStatus } from '../entity/loan.entity';

export class UpdateLoanDto {
  @ApiPropertyOptional({
    description: 'Estado del préstamo',
    enum: LoanStatus,
    example: LoanStatus.APROBADO,
  })
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @ApiPropertyOptional({
    description: 'Razón de rechazo (requerido si status es rechazado)',
    example: 'Documentación incompleta',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario que gestiona el préstamo',
  })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}
