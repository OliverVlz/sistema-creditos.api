import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DocumentType } from 'src/document-type/infrastructure/entity/document-type.entity';

const documentTypes = [
  { code: 'CEDULA', name: 'Copia de cédula (ambos lados)' },
  { code: 'NOMINA', name: 'Comprobante de pago de nómina' },
  { code: 'CONSTANCIA_TIEMPO', name: 'Constancia de tiempo de servicio' },
  { code: 'MESADA', name: 'Comprobante de pago de mesada' },
];

@Injectable()
export class DocumentTypeSeeder {
  async seed(documentTypeRepository: Repository<DocumentType>): Promise<void> {
    for (const docType of documentTypes) {
      const existing = await documentTypeRepository.findOne({
        where: { code: docType.code },
      });

      if (!existing) {
        const newDocType = documentTypeRepository.create(docType);
        await documentTypeRepository.save(newDocType);
      }
    }
  }
}
