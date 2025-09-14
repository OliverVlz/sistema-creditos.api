import { IsNotEmpty, IsString, IsArray, IsNumber, IsBoolean, IsOptional, IsObject, MaxLength, Min, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentTypeDto {
  @ApiProperty({ description: 'Código único del tipo de documento', example: 'CERTIFICADO_AVALUO' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Nombre del tipo de documento', example: 'Certificado de Avalúo' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Descripción detallada del tipo de documento', example: 'Documento que certifica el valor de un bien inmueble' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    description: 'Tipos MIME permitidos para este documento', 
    example: ['application/pdf', 'image/jpeg', 'image/png'],
    default: ['application/pdf']
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @IsOptional()
  mimeTypes?: string[];

  @ApiProperty({ 
    description: 'Tamaño máximo del archivo en bytes', 
    example: 10485760,
    default: 10485760
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxFileSize?: number;

  @ApiProperty({ 
    description: 'Reglas de validación específicas para este tipo de documento',
    example: { minWidth: 800, minHeight: 600, requiredFields: ['fecha_emision', 'valor'] }
  })
  @IsOptional()
  @IsObject()
  validationRules?: object;

  @ApiProperty({ 
    description: 'Indica si el tipo de documento está activo', 
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ 
    description: 'Orden de visualización en la UI', 
    example: 0,
    default: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
