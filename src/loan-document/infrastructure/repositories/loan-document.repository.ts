import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanDocument } from '../entity/loan-document.entity';

type CreateLoanDocumentData = {
  loanId: string;
  documentTypeId: string;
  url: string;
};

type BatchDocumentItem = {
  documentTypeId: string;
  url: string;
};

@Injectable()
export class LoanDocumentRepository {
  constructor(
    @InjectRepository(LoanDocument)
    private loanDocumentRepository: Repository<LoanDocument>,
  ) {}

  async create(data: CreateLoanDocumentData): Promise<LoanDocument> {
    const newDocument = this.loanDocumentRepository.create({
      url: data.url,
      loan: { id: data.loanId },
      documentType: { id: data.documentTypeId },
    });
    return this.loanDocumentRepository.save(newDocument);
  }

  async createBatch(
    loanId: string,
    documents: BatchDocumentItem[],
  ): Promise<LoanDocument[]> {
    const entities = documents.map(doc =>
      this.loanDocumentRepository.create({
        url: doc.url,
        loan: { id: loanId },
        documentType: { id: doc.documentTypeId },
      }),
    );
    return this.loanDocumentRepository.save(entities);
  }

  async findOne(id: string): Promise<LoanDocument> {
    const document = await this.loanDocumentRepository.findOne({
      where: { id },
      relations: ['loan', 'documentType'],
    });
    if (!document) {
      throw new NotFoundException(`Documento con ID ${id} no encontrado`);
    }
    return document;
  }

  async findByLoan(loanId: string): Promise<LoanDocument[]> {
    return this.loanDocumentRepository.find({
      where: { loan: { id: loanId } },
      relations: ['documentType'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async update(id: string, url: string): Promise<LoanDocument> {
    await this.loanDocumentRepository.update(id, { url });
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.loanDocumentRepository.delete(id);
  }
}
