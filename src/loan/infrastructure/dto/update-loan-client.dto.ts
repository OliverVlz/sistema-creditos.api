import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO para actualización de préstamo por CLIENTE
 * Solo puede modificar documentos (agregar nuevos o reemplazar existentes)
 */
export class UpdateLoanClientDto {
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
