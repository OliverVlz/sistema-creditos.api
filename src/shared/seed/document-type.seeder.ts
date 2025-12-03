import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DocumentType } from 'src/document-type/infrastructure/entity/document-type.entity';

const documentTypes = [
  { name: 'Copia de cédula (ambos lados)' },
  { name: 'Comprobante de pago de nómina' },
  { name: 'Constancia de tiempo de servicio' },
  { name: 'Comprobante de pago de mesada' },
];

@Injectable()
export class DocumentTypeSeeder {
  async seed(documentTypeRepository: Repository<DocumentType>): Promise<void> {
    for (const docType of documentTypes) {
      const existing = await documentTypeRepository.findOne({
        where: { name: docType.name },
      });

      if (!existing) {
        const newDocType = documentTypeRepository.create(docType);
        await documentTypeRepository.save(newDocType);
      }
    }
  }
}
