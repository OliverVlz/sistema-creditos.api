import {
  IsUUID,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { LoanStatus } from '../entity/loan.entity';

export class UpdateLoanMultipartDto {
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
      'Códigos de tipos de documento para archivos NUEVOS (en el mismo orden que los archivos nuevos)',
    example: '["CEDULA", "COMPROBANTE_INGRESOS"]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map(s => s.trim());
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  newDocumentTypeCodes?: string[];

  @ApiPropertyOptional({
    description:
      'IDs de documentos existentes a REEMPLAZAR con nuevos archivos (mismo orden que replaceFiles)',
    example: '["uuid-doc-1", "uuid-doc-2"]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map(s => s.trim());
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  replaceDocumentIds?: string[];
}
