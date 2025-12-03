import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentTypeDto {
  @ApiProperty({
    description: 'Código único del tipo de documento',
    example: 'CEDULA',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Nombre del tipo de documento',
    example: 'Copia de cédula (ambos lados)',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
