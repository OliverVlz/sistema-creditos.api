import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class DocumentItemDto {
  @ApiProperty({ description: 'ID del tipo de documento' })
  @IsNotEmpty()
  @IsUUID()
  documentTypeId: string;

  @ApiProperty({
    description: 'URL del documento',
    example: 'https://storage.example.com/docs/file.pdf',
  })
  @IsNotEmpty()
  @IsString()
  url: string;
}

export class CreateLoanDocumentsBatchDto {
  @ApiProperty({ description: 'ID del préstamo' })
  @IsNotEmpty()
  @IsUUID()
  loanId: string;

  @ApiProperty({
    description: 'Lista de documentos a subir',
    type: [DocumentItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentItemDto)
  documents: DocumentItemDto[];
}
