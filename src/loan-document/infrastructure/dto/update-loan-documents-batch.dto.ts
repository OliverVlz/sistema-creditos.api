import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class UpdateDocumentItemDto {
  @ApiProperty({ description: 'ID del documento a actualizar' })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Nueva URL del documento',
    example: 'https://storage.example.com/docs/cedula-corregida.pdf',
  })
  @IsNotEmpty()
  @IsString()
  url: string;
}

export class UpdateLoanDocumentsBatchDto {
  @ApiProperty({
    description: 'Lista de documentos a actualizar',
    type: [UpdateDocumentItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDocumentItemDto)
  documents: UpdateDocumentItemDto[];
}


