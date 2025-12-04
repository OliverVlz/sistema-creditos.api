import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
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

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly minioClient: Minio.Client;
  private readonly bucket: string;
  private readonly endpoint: string;
  private readonly port: number;
  private readonly useSSL: boolean;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    this.port = this.configService.get<number>('MINIO_PORT', 9000);
    this.useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
    this.bucket = this.configService.get<string>('MINIO_BUCKET', 'loan-documents');

    this.minioClient = new Minio.Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (exists) {
        this.logger.log(`Bucket "${this.bucket}" ya existe`);
        return;
      }

      await this.minioClient.makeBucket(this.bucket);
      this.logger.log(`Bucket "${this.bucket}" creado exitosamente`);

      // Configurar política pública de lectura
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      };
      await this.minioClient.setBucketPolicy(this.bucket, JSON.stringify(policy));
      this.logger.log(`Política de lectura pública configurada para "${this.bucket}"`);
    } catch (error) {
      this.logger.error(`Error al verificar/crear bucket: ${error.message}`);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'documents',
  ): Promise<UploadedFile> {
    const fileExtension = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${fileExtension}`;

    await this.minioClient.putObject(
      this.bucket,
      key,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    const url = this.getPublicUrl(key);

    return {
      url,
      key,
      bucket: this.bucket,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'documents',
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(key: string): Promise<void> {
    await this.minioClient.removeObject(this.bucket, key);
  }

  async deleteMultipleFiles(keys: string[]): Promise<void> {
    await this.minioClient.removeObjects(this.bucket, keys);
  }

  getPublicUrl(key: string): string {
    const protocol = this.useSSL ? 'https' : 'http';
    // Para desarrollo local, usar localhost en lugar del hostname interno de docker
    const publicEndpoint = this.configService.get<string>(
      'MINIO_PUBLIC_ENDPOINT',
      `localhost:${this.port}`,
    );
    return `${protocol}://${publicEndpoint}/${this.bucket}/${key}`;
  }

  async getPresignedUrl(key: string, expirySeconds: number = 3600): Promise<string> {
    return this.minioClient.presignedGetObject(this.bucket, key, expirySeconds);
  }
}
