import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { generateSecureToken } from './auth';

export interface FileUploadResult {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  path?: string; // For local storage
  key?: string;  // For S3 storage
}

export interface StorageOptions {
  allowedMimeTypes?: string[];
  maxFileSize?: number;
  generateUniqueFilename?: boolean;
}

export class FileStorageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDirectory();
  }

  /**
   * Ensure uploads directory exists
   */
  private ensureUploadsDirectory(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Generate a unique filename
   */
  private generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = generateSecureToken(8);
    return `${name}_${timestamp}_${random}${ext}`;
  }

  /**
   * Validate file based on options
   */
  private validateFile(file: Express.Multer.File, options: StorageOptions = {}): void {
    const { allowedMimeTypes, maxFileSize } = options;

    // Check file size
    if (maxFileSize && file.size > maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxFileSize} bytes`);
    }

    // Check mime type
    if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }
  }

  /**
   * Store file locally
   */
  async storeFileLocal(
    file: Express.Multer.File, 
    options: StorageOptions = {}
  ): Promise<FileUploadResult> {
    this.validateFile(file, options);

    const filename = options.generateUniqueFilename !== false 
      ? this.generateUniqueFilename(file.originalname)
      : file.originalname;

    const filePath = path.join(this.uploadsDir, filename);

    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);

    return {
      filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url: `/uploads/${filename}`,
      path: filePath,
    };
  }

  /**
   * Store file in S3-compatible storage (MinIO, AWS S3, etc.)
   */
  async storeFileS3(
    file: Express.Multer.File, 
    options: StorageOptions = {}
  ): Promise<FileUploadResult> {
    this.validateFile(file, options);

    // This would integrate with AWS SDK or MinIO client
    // For now, we'll simulate S3 storage
    const filename = options.generateUniqueFilename !== false 
      ? this.generateUniqueFilename(file.originalname)
      : file.originalname;

    const key = `uploads/${filename}`;

    // TODO: Implement actual S3 upload
    // const uploadResult = await s3Client.upload({
    //   Bucket: config.storage.bucket,
    //   Key: key,
    //   Body: file.buffer,
    //   ContentType: file.mimetype,
    // }).promise();

    // For development with MinIO, the URL would be:
    const url = `${config.storage.endpoint || 'http://localhost:9000'}/${config.storage.bucket}/${key}`;

    return {
      filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      url,
      key,
    };
  }

  /**
   * Store file based on configuration
   */
  async storeFile(
    file: Express.Multer.File, 
    options: StorageOptions = {}
  ): Promise<FileUploadResult> {
    if (config.storage.type === 's3') {
      return this.storeFileS3(file, options);
    } else {
      return this.storeFileLocal(file, options);
    }
  }

  /**
   * Delete file from local storage
   */
  async deleteFileLocal(filename: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  /**
   * Delete file from S3 storage
   */
  async deleteFileS3(key: string): Promise<void> {
    // TODO: Implement actual S3 deletion
    // await s3Client.deleteObject({
    //   Bucket: config.storage.bucket,
    //   Key: key,
    // }).promise();
    console.log(`Would delete S3 object with key: ${key}`);
  }

  /**
   * Delete file based on configuration
   */
  async deleteFile(fileIdentifier: string): Promise<void> {
    if (config.storage.type === 's3') {
      return this.deleteFileS3(fileIdentifier);
    } else {
      return this.deleteFileLocal(fileIdentifier);
    }
  }

  /**
   * Generate signed URL for private file access (S3 only)
   */
  async generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (config.storage.type !== 's3') {
      throw new Error('Signed URLs are only available for S3 storage');
    }

    // TODO: Implement actual signed URL generation
    // return s3Client.getSignedUrl('getObject', {
    //   Bucket: config.storage.bucket,
    //   Key: key,
    //   Expires: expiresIn,
    // });

    // For development
    return `${config.storage.endpoint}/${config.storage.bucket}/${key}?expires=${Date.now() + expiresIn * 1000}`;
  }
}

// File type definitions for common use cases
export const FileTypes = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  CREDENTIALS: [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ],
} as const;

// File size limits (in bytes)
export const FileSizeLimits = {
  SMALL: 1 * 1024 * 1024,      // 1MB
  MEDIUM: 5 * 1024 * 1024,     // 5MB
  LARGE: 10 * 1024 * 1024,     // 10MB
  XLARGE: 50 * 1024 * 1024,    // 50MB
} as const;

// Create singleton instance
export const fileStorage = new FileStorageService();