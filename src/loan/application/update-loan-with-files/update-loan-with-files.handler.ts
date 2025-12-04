import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLoanWithFilesCommand } from './update-loan-with-files.command';
import { LoanRepository } from '../../infrastructure/repositories/loan.repository';
import { LoanDocumentRepository } from 'src/loan-document/infrastructure/repositories/loan-document.repository';
import { DocumentTypeRepository } from 'src/document-type/infrastructure/repositories/document-type.repository';
import { UserRepository } from 'src/identity/infrastructure/repositories/user.repository';
import { StorageService } from 'src/storage/infrastructure/storage.service';
import {
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { LoanStatus } from '../../infrastructure/entity/loan.entity';
import { UserRole } from 'src/shared/enums';

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
      updatedBy,
      updatedByRole,
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

    // Validar permisos según rol
    const isClient = updatedByRole === UserRole.CLIENTE;
    const isAdminOrAdvisor =
      updatedByRole === UserRole.ADMIN || updatedByRole === UserRole.ASESOR;

    if (isClient) {
      // Cliente solo puede modificar SUS préstamos
      if (existingLoan.client?.user?.id !== updatedBy) {
        throw new ForbiddenException(
          'No tienes permiso para modificar este préstamo',
        );
      }

      // Cliente NO puede cambiar status, rejectionReason ni managerId
      if (status || rejectionReason || managerId) {
        throw new ForbiddenException(
          'No tienes permiso para modificar el estado del préstamo',
        );
      }
    }

    // Solo Admin/Asesor pueden cambiar status
    if ((status || rejectionReason || managerId) && !isAdminOrAdvisor) {
      throw new ForbiddenException(
        'Solo administradores o asesores pueden modificar el estado del préstamo',
      );
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

    // Objeto para trackear los cambios realizados
    const changes: {
      loan?: {
        status?: { from: string; to: string };
        rejectionReason?: { from: string | null; to: string };
        managerId?: { from: string | null; to: string };
      };
      documentsAdded?: { documentTypeCode: string; url: string }[];
      documentsReplaced?: { documentId: string; newUrl: string }[];
    } = {};

    // Actualizar datos del préstamo (solo si hay campos permitidos)
    if (isAdminOrAdvisor) {
      const loanChanges: any = {};

      if (status && status !== existingLoan.status) {
        loanChanges.status = { from: existingLoan.status, to: status };
      }
      if (rejectionReason && rejectionReason !== existingLoan.rejectionReason) {
        loanChanges.rejectionReason = {
          from: existingLoan.rejectionReason || null,
          to: rejectionReason,
        };
      }
      if (managerId) {
        loanChanges.managerId = {
          from: existingLoan.manager?.id || null,
          to: managerId,
        };
      }

      if (Object.keys(loanChanges).length > 0) {
        changes.loan = loanChanges;

        const updateData = {
          ...(status && { status }),
          ...(rejectionReason && { rejectionReason }),
          ...(managerId && { manager: { id: managerId } }),
          ...(status && { managedAt: new Date() }),
        };
        await this.loanRepository.updateLoan(loanId, updateData);
      }
    }

    // Verificar si el cliente está haciendo cambios en documentos
    const clientMakingDocumentChanges =
      isClient &&
      ((replaceDocumentIds?.length > 0 && replaceFiles?.length > 0) ||
        (newDocumentTypeCodes?.length > 0 && newFiles?.length > 0));

    // 1. Reemplazar documentos existentes
    if (replaceDocumentIds?.length > 0 && replaceFiles?.length > 0) {
      const replacedDocs = await this.replaceExistingDocuments(
        loanId,
        replaceDocumentIds,
        replaceFiles,
      );
      changes.documentsReplaced = replacedDocs;
    }

    // 2. Agregar documentos nuevos
    if (newDocumentTypeCodes?.length > 0 && newFiles?.length > 0) {
      const addedDocs = await this.addNewDocuments(
        loanId,
        newDocumentTypeCodes,
        newFiles,
      );
      changes.documentsAdded = addedDocs;
    }

    // 3. Si el cliente modificó documentos, volver estado a PENDIENTE
    if (
      clientMakingDocumentChanges &&
      existingLoan.status !== LoanStatus.PENDIENTE
    ) {
      changes.loan = {
        ...changes.loan,
        status: { from: existingLoan.status, to: LoanStatus.PENDIENTE },
      };
      await this.loanRepository.updateLoan(loanId, {
        status: LoanStatus.PENDIENTE,
      });
      this.logger.log(
        `Estado del préstamo ${loanId} cambiado a PENDIENTE por modificación de documentos del cliente`,
      );
    }

    return {
      loanId,
      message: 'Préstamo actualizado correctamente',
      changes,
    };
  }

  private async replaceExistingDocuments(
    loanId: string,
    documentIds: string[],
    files: Express.Multer.File[],
  ): Promise<{ documentId: string; newUrl: string }[]> {
    if (documentIds.length !== files.length) {
      throw new BadRequestException(
        `Cantidad de documentos a reemplazar (${documentIds.length}) no coincide con archivos (${files.length})`,
      );
    }

    const replacedDocuments: { documentId: string; newUrl: string }[] = [];

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

      replacedDocuments.push({ documentId, newUrl: uploadResult.url });

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

    return replacedDocuments;
  }

  private async addNewDocuments(
    loanId: string,
    documentTypeCodes: string[],
    files: Express.Multer.File[],
  ): Promise<{ documentTypeCode: string; url: string }[]> {
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
        const documentTypeCode = documentTypeCodes[index];
        const documentTypeId = codeToIdMap.get(documentTypeCode);
        const uploadResult = await this.storageService.uploadFile(
          file,
          `loans/${loanId}`,
        );
        this.logger.log(
          `Nuevo archivo subido: ${file.originalname} -> ${uploadResult.url}`,
        );
        return { documentTypeId, documentTypeCode, url: uploadResult.url };
      }),
    );

    await this.loanDocumentRepository.createBatch(
      loanId,
      uploadedDocuments.map(d => ({
        documentTypeId: d.documentTypeId,
        url: d.url,
      })),
    );

    return uploadedDocuments.map(d => ({
      documentTypeCode: d.documentTypeCode,
      url: d.url,
    }));
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
