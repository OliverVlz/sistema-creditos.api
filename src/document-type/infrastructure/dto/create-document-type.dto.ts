import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentTypeDto {
  @ApiProperty({
    description: 'Nombre del tipo de documento',
    example: 'Copia de cédula',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
