import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as path from 'path';

export interface UploadResult {
  key: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint?: string;
  private readonly publicUrl: string;

  // Allowed file types
  private readonly allowedMimeTypes = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    spreadsheets: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  };

  // Max file sizes (in bytes)
  private readonly maxFileSizes = {
    image: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    spreadsheet: 10 * 1024 * 1024, // 10MB
  };

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Support both AWS S3 and Cloudflare R2
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'default-bucket';
    this.region = this.configService.get<string>('S3_REGION') || 'auto';
    this.endpoint = this.configService.get<string>('S3_ENDPOINT'); // For R2
    this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL') || '';

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY') || '',
      },
    });

    this.logger.log(`File upload service initialized with bucket: ${this.bucket}`);
  }

  /**
   * Upload file to S3/R2
   */
  async uploadFile(
    file: Express.Multer.File,
    tenantId: string,
    folder: string = 'general',
  ): Promise<UploadResult> {
    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const key = `tenants/${tenantId}/${folder}/${filename}`;

    try {
      // Upload to S3/R2
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          tenantId,
        },
      });

      await this.s3Client.send(command);

      // Generate URL
      const url = this.publicUrl 
        ? `${this.publicUrl}/${key}`
        : await getSignedUrl(this.s3Client, new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
          }), { expiresIn: 3600 });

      this.logger.log(`File uploaded: ${key} (${file.size} bytes)`);

      return {
        key,
        url,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error}`);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    tenantId: string,
    folder: string = 'general',
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, tenantId, folder);
      results.push(result);
    }

    return results;
  }

  /**
   * Delete file from S3/R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error}`);
      throw new BadRequestException('Failed to delete file');
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.deleteFile(key);
    }
  }

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error}`);
      throw new BadRequestException('Failed to generate signed URL');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get file metadata: ${error}`);
      throw new BadRequestException('File not found');
    }
  }

  /**
   * Validate file type and size
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file type
    const isImage = this.allowedMimeTypes.images.includes(file.mimetype);
    const isDocument = this.allowedMimeTypes.documents.includes(file.mimetype);
    const isSpreadsheet = this.allowedMimeTypes.spreadsheets.includes(file.mimetype);

    if (!isImage && !isDocument && !isSpreadsheet) {
      throw new BadRequestException(
        `Invalid file type. Allowed: images (jpeg, png, gif, webp), documents (pdf, doc, docx), spreadsheets (csv, xls, xlsx)`,
      );
    }

    // Check file size
    let maxSize = this.maxFileSizes.document;
    if (isImage) maxSize = this.maxFileSizes.image;
    if (isSpreadsheet) maxSize = this.maxFileSizes.spreadsheet;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
      );
    }
  }

  /**
   * Track storage usage for tenant
   */
  async trackStorageUsage(tenantId: string, bytes: number): Promise<void> {
    try {
      // Get current storage usage
      const usage = await this.prisma.usageRecord.findFirst({
        where: {
          tenantId,
          resource: 'storage',
        },
        orderBy: {
          recordedAt: 'desc',
        },
      });

      const currentUsage = usage?.amount || 0;
      const newUsage = currentUsage + Math.round(bytes / 1024 / 1024); // Convert to MB

      // Create new usage record
      await this.prisma.usageRecord.create({
        data: {
          tenantId,
          resource: 'storage',
          amount: newUsage,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to track storage usage: ${error}`);
    }
  }

  /**
   * Get tenant storage usage
   */
  async getStorageUsage(tenantId: string): Promise<number> {
    const usage = await this.prisma.usageRecord.findFirst({
      where: {
        tenantId,
        resource: 'storage',
      },
      orderBy: {
        recordedAt: 'desc',
      },
    });

    return usage?.amount || 0; // In MB
  }
}
