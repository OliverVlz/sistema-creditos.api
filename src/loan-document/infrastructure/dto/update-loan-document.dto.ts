import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLoanDocumentDto {
  @ApiProperty({
    description: 'Nueva URL del documento',
    example: 'https://storage.example.com/docs/cedula-corregida.pdf',
  })
  @IsNotEmpty()
  @IsString()
  url: string;
}




