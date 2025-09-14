import { IsUUID, IsNumber, Min, Max, IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { CreateLoanDto } from './create-loan.dto';
import { LoanStatus } from '../entity/loan.entity';

export class UpdateLoanDto extends PartialType(CreateLoanDto) {
  @ApiPropertyOptional({ description: 'Estado del préstamo', enum: LoanStatus })
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @ApiPropertyOptional({ description: 'Razón de rechazo', example: 'Documentación incompleta' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'ID del usuario que aprueba el préstamo' })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @ApiPropertyOptional({ description: 'Fecha de aprobación del préstamo', example: '2023-01-15' })
  @IsOptional()
  @IsDateString()
  approvedAt?: Date;

  @ApiPropertyOptional({ description: 'Fecha de firma del préstamo', example: '2023-01-20' })
  @IsOptional()
  @IsDateString()
  signedAt?: Date;

  @ApiPropertyOptional({ description: 'Fecha de desembolso del préstamo', example: '2023-01-25' })
  @IsOptional()
  @IsDateString()
  disbursedAt?: Date;

  @ApiPropertyOptional({ description: 'ID del usuario que actualizó el préstamo' })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;

  // Aquí, los campos como totalAmount y processingFee no se actualizan directamente, se calculan
}
