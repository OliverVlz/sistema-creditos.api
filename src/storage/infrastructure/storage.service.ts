import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  url: string;
  key: string;
  bucket: string;
  originalName: string;
  mimeType: string;
  size: number;
}

interface StorageInputFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucket: string;
  private readonly publicBucket: string;
  private readonly endpoint: string;
  private readonly port: number;
  private readonly useSSL: boolean;
  private readonly bucketPublicRead: boolean;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'localhost',
    );
    this.port = this.configService.get<number>('MINIO_PORT', 9000);
    this.useSSL =
      this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
    this.bucketPublicRead =
      this.configService.get<string>('MINIO_BUCKET_PUBLIC_READ', 'false') ===
      'true';
    this.bucket = this.configService.get<string>(
      'MINIO_BUCKET',
      'loan-documents',
    );
    this.publicBucket = this.configService.get<string>(
      'MINIO_PUBLIC_BUCKET',
      'public',
    );

    this.minioClient = new Minio.Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: this.configService.get<string>(
        'MINIO_ACCESS_KEY',
        'minioadmin',
      ),
      secretKey: this.configService.get<string>(
        'MINIO_SECRET_KEY',
        'minioadmin',
      ),
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists(this.bucket, this.bucketPublicRead);
    if (this.publicBucket !== this.bucket) {
      await this.ensureBucketExists(this.publicBucket, true);
    }
  }

  private async ensureBucketExists(
    bucketName: string,
    setPublicRead: boolean,
  ): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucketName);
      if (exists) {
        this.logger.log(`Bucket "${bucketName}" ya existe`);
        return;
      }

      await this.minioClient.makeBucket(bucketName);
      this.logger.log(`Bucket "${bucketName}" creado exitosamente`);

      if (setPublicRead) {
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(
          bucketName,
          JSON.stringify(policy),
        );
        this.logger.log(
          `Política de lectura pública configurada para "${bucketName}"`,
        );
      } else {
        this.logger.log(
          `Bucket "${bucketName}" configurado como privado (sin política pública)`,
        );
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al verificar/crear bucket: ${message}`);
    }
  }

  async uploadFile(
    file: StorageInputFile,
    folder: string = 'documents',
    bucketName: string = this.bucket,
  ): Promise<UploadedFile> {
    const fileExtension = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${fileExtension}`;

    try {
      await this.minioClient.putObject(
        bucketName,
        key,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );
    } catch (error: unknown) {
      const minioError = error as {
        code?: string;
        message?: string;
        name?: string;
      };
      this.logger.error(
        `Error subiendo archivo a MinIO bucket=${bucketName} key=${key} code=${minioError.code || minioError.name || 'unknown'} message=${minioError.message || 'sin mensaje'}`,
      );
      throw new InternalServerErrorException(
        `No se pudo subir el archivo a almacenamiento (${minioError.code || 'UNKNOWN'})`,
      );
    }

    const url = this.getPublicUrl(key, bucketName);

    return {
      url,
      key,
      bucket: bucketName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async uploadMultipleFiles(
    files: StorageInputFile[],
    folder: string = 'documents',
    bucketName: string = this.bucket,
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file =>
      this.uploadFile(file, folder, bucketName),
    );
    return Promise.all(uploadPromises);
  }

  async deleteFile(key: string, bucketName: string = this.bucket): Promise<void> {
    await this.minioClient.removeObject(bucketName, key);
  }

  async deleteMultipleFiles(
    keys: string[],
    bucketName: string = this.bucket,
  ): Promise<void> {
    await this.minioClient.removeObjects(bucketName, keys);
  }

  getPublicUrl(key: string, bucketName: string = this.bucket): string {
    const protocol = this.useSSL ? 'https' : 'http';
    // Para desarrollo local, usar localhost en lugar del hostname interno de docker
    const publicEndpoint = this.configService.get<string>(
      'MINIO_PUBLIC_ENDPOINT',
      `localhost:${this.port}`,
    );
    return `${protocol}://${publicEndpoint}/${bucketName}/${key}`;
  }

  async getPresignedUrl(
    key: string,
    expirySeconds: number = 3600,
  ): Promise<string> {
    return this.minioClient.presignedGetObject(this.bucket, key, expirySeconds);
  }

  extractObjectKeyFromUrl(urlOrKey: string): string {
    if (!urlOrKey) {
      return '';
    }

    try {
      const parsed = new URL(urlOrKey);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (pathParts[0] === this.bucket || pathParts[0] === this.publicBucket) {
        return pathParts.slice(1).join('/');
      }

      return pathParts.join('/');
    } catch {
      return urlOrKey.replace(/^\/+/, '');
    }
  }

  extractBucketFromUrl(urlOrKey: string): string {
    if (!urlOrKey) {
      return this.bucket;
    }

    try {
      const parsed = new URL(urlOrKey);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (!pathParts.length) {
        return this.bucket;
      }
      return pathParts[0];
    } catch {
      return this.bucket;
    }
  }

  getPublicBucketName(): string {
    return this.publicBucket;
  }
}
