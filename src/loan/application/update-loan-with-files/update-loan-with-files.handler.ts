import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanWithFilesCommand } from './update-loan-with-files.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { LoanDocumentRepository } from 'src/loan-document/infrastructure/repositories/loan-document.repository';
import { DocumentTypeRepository } from 'src/document-type/infrastructure/repositories/document-type.repository';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { StorageService } from 'src/storage/infrastructure/storage.service';
import { NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { LoanStatus } from '../../infrastructure/entity/loan.entity';

@CommandHandler(UpdateLoanWithFilesCommand)
export class UpdateLoanWithFilesHandler
  implements ICommandHandler<UpdateLoanWithFilesCommand>
{
  private readonly logger = new Logger(UpdateLoanWithFilesHandler.name);

  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly loanDocumentRepository: LoanDocumentRepository,
    private readonly documentTypeRepository: DocumentTypeRepository,
    private readonly userRepository: UserRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(command: UpdateLoanWithFilesCommand): Promise<any> {
    const {
      loanId,
      status,
      rejectionReason,
      managerId,
      newDocumentTypeCodes,
      newFiles,
      replaceDocumentIds,
      replaceFiles,
    } = command;

    // Validar préstamo existente
    const existingLoan = await this.loanRepository.findOne(loanId);
    if (!existingLoan) {
      throw new NotFoundException(`Préstamo con ID ${loanId} no encontrado`);
    }

    // Validaciones de negocio
    if (status === LoanStatus.RECHAZADO && !rejectionReason) {
      throw new BadRequestException(
        'Se requiere una razón de rechazo para rechazar el préstamo',
      );
    }

    if (managerId) {
      const manager = await this.userRepository.findById(managerId);
      if (!manager) {
        throw new NotFoundException(
          `Usuario gestor con ID ${managerId} no encontrado`,
        );
      }
    }

    // Actualizar datos del préstamo
    const updateData = {
      ...(status && { status }),
      ...(rejectionReason && { rejectionReason }),
      ...(managerId && { manager: { id: managerId } }),
      ...(status && { managedAt: new Date() }),
    };

    if (Object.keys(updateData).length > 0) {
      await this.loanRepository.updateLoan(loanId, updateData);
    }

    // 1. Reemplazar documentos existentes
    if (replaceDocumentIds?.length > 0 && replaceFiles?.length > 0) {
      await this.replaceExistingDocuments(
        loanId,
        replaceDocumentIds,
        replaceFiles,
      );
    }

    // 2. Agregar documentos nuevos
    if (newDocumentTypeCodes?.length > 0 && newFiles?.length > 0) {
      await this.addNewDocuments(loanId, newDocumentTypeCodes, newFiles);
    }

    return { loanId, message: 'Préstamo actualizado correctamente' };
  }

  private async replaceExistingDocuments(
    loanId: string,
    documentIds: string[],
    files: Express.Multer.File[],
  ): Promise<void> {
    if (documentIds.length !== files.length) {
      throw new BadRequestException(
        `Cantidad de documentos a reemplazar (${documentIds.length}) no coincide con archivos (${files.length})`,
      );
    }

    for (let i = 0; i < documentIds.length; i++) {
      const documentId = documentIds[i];
      const file = files[i];

      // Obtener documento existente
      const existingDoc = await this.loanDocumentRepository.findOne(documentId);

      // Extraer key del archivo viejo para eliminarlo de MinIO
      const oldKey = this.extractKeyFromUrl(existingDoc.url);

      // Subir nuevo archivo
      const uploadResult = await this.storageService.uploadFile(
        file,
        `loans/${loanId}`,
      );
      this.logger.log(
        `Archivo reemplazado: ${file.originalname} -> ${uploadResult.url}`,
      );

      // Actualizar URL en BD
      await this.loanDocumentRepository.update(documentId, uploadResult.url);

      // Eliminar archivo viejo de MinIO (después de confirmar el update)
      if (oldKey) {
        try {
          await this.storageService.deleteFile(oldKey);
          this.logger.log(`Archivo viejo eliminado de MinIO: ${oldKey}`);
        } catch (error) {
          this.logger.warn(
            `No se pudo eliminar archivo viejo: ${oldKey} - ${error.message}`,
          );
        }
      }
    }
  }

  private async addNewDocuments(
    loanId: string,
    documentTypeCodes: string[],
    files: Express.Multer.File[],
  ): Promise<void> {
    if (documentTypeCodes.length !== files.length) {
      throw new BadRequestException(
        `Cantidad de códigos (${documentTypeCodes.length}) no coincide con archivos nuevos (${files.length})`,
      );
    }

    // Validar tipos de documento
    const documentTypes =
      await this.documentTypeRepository.findByCodes(documentTypeCodes);
    const codeToIdMap = new Map(documentTypes.map(dt => [dt.code, dt.id]));

    const invalidCodes = documentTypeCodes.filter(
      code => !codeToIdMap.has(code),
    );
    if (invalidCodes.length > 0) {
      throw new BadRequestException(
        `Tipos de documento no encontrados: ${invalidCodes.join(', ')}`,
      );
    }

    // Subir archivos y crear registros
    const uploadedDocuments = await Promise.all(
      files.map(async (file, index) => {
        const documentTypeId = codeToIdMap.get(documentTypeCodes[index]);
        const uploadResult = await this.storageService.uploadFile(
          file,
          `loans/${loanId}`,
        );
        this.logger.log(
          `Nuevo archivo subido: ${file.originalname} -> ${uploadResult.url}`,
        );
        return { documentTypeId, url: uploadResult.url };
      }),
    );

    await this.loanDocumentRepository.createBatch(loanId, uploadedDocuments);
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      // URL formato: http://localhost:9000/loan-documents/loans/{loanId}/{filename}
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // Remover el primer elemento vacío y el nombre del bucket
      const keyParts = pathParts.slice(2); // ["loans", "{loanId}", "{filename}"]
      return keyParts.join('/');
    } catch {
      this.logger.warn(`No se pudo extraer key de URL: ${url}`);
      return null;
    }
  }
}
