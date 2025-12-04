import { IsUUID, IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { LoanStatus } from '../entity/loan.entity';

/**
 * DTO para actualización de préstamo por ADMIN/ASESOR
 * Puede modificar: status, rejectionReason, managerId, y documentos
 */
export class UpdateLoanAdminDto {
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

  @ApiPropertyOptional({
    description:
      'Códigos de tipos de documento para archivos NUEVOS (en el mismo orden que los archivos)',
    example: '["CEDULA", "NOMINA"]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map((s: string) => s.trim());
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  newDocumentTypeCodes?: string[];

  @ApiPropertyOptional({
    description:
      'IDs de documentos existentes a REEMPLAZAR con nuevos archivos',
    example: '["uuid-doc-1", "uuid-doc-2"]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map((s: string) => s.trim());
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  replaceDocumentIds?: string[];
}
