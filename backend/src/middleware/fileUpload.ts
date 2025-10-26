import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { FileTypes, FileSizeLimits } from '../utils/fileStorage';
import { ApiError } from './errorHandler';

/**
 * Configure multer for memory storage
 * Files will be stored in memory and then processed by our file storage service
 */
const storage = multer.memoryStorage();

/**
 * Base multer configuration
 */
const createMulterConfig = (options: {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  maxFiles?: number;
}) => {
  return multer({
    storage,
    limits: {
      fileSize: options.maxFileSize || FileSizeLimits.MEDIUM,
      files: options.maxFiles || 5,
    },
    fileFilter: (req, file, cb) => {
      // Check mime type if specified
      if (options.allowedMimeTypes && !(options.allowedMimeTypes as string[]).includes(file.mimetype)) {
        cb(new ApiError(
          `File type ${file.mimetype} not allowed. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
          400
        ));
        return;
      }

      // Check for potential security issues
      const dangerousExtensions = ['.exe', '.bat', '.sh', '.cmd', '.scr', '.vbs', '', '.php'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (dangerousExtensions.includes(fileExtension)) {
        cb(new ApiError('File type not allowed for security reasons', 400));
        return;
      }

      cb(null, true);
    },
  });
};

/**
 * Middleware for handling single file upload
 */
export const uploadSingle = (fieldName: string, options: {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
} = {}) => {
  const upload = createMulterConfig({ ...options, maxFiles: 1 });
  return upload.single(fieldName);
};

/**
 * Middleware for handling multiple file uploads
 */
export const uploadMultiple = (fieldName: string, options: {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  maxFiles?: number;
} = {}) => {
  const upload = createMulterConfig(options);
  return upload.array(fieldName, options.maxFiles || 5);
};

/**
 * Middleware for handling multiple fields with files
 */
export const uploadFields = (fields: { name: string; maxCount: number }[], options: {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
} = {}) => {
  const upload = createMulterConfig(options);
  return upload.fields(fields);
};

/**
 * Predefined upload configurations for common use cases
 */

/**
 * For uploading customer credential documents
 */
export const uploadCredentials = uploadMultiple('credentials', {
  allowedMimeTypes: [...FileTypes.CREDENTIALS] as string[],
  maxFileSize: FileSizeLimits.LARGE,
  maxFiles: 10,
});

/**
 * For uploading order-related documents (invoices, certificates, etc.)
 */
export const uploadOrderDocuments = uploadFields([
  { name: 'invoices', maxCount: 5 },
  { name: 'certificates', maxCount: 10 },
  { name: 'photos', maxCount: 20 },
], {
  allowedMimeTypes: [...FileTypes.DOCUMENTS, ...FileTypes.IMAGES] as string[],
  maxFileSize: FileSizeLimits.LARGE,
});

/**
 * For uploading test result documents
 */
export const uploadTestResults = uploadMultiple('testResults', {
  allowedMimeTypes: [...FileTypes.DOCUMENTS] as string[],
  maxFileSize: FileSizeLimits.MEDIUM,
  maxFiles: 5,
});

/**
 * For uploading product/broodstock photos
 */
export const uploadProductPhotos = uploadMultiple('photos', {
  allowedMimeTypes: [...FileTypes.IMAGES] as string[],
  maxFileSize: FileSizeLimits.MEDIUM,
  maxFiles: 10,
});

/**
 * For uploading general documents
 */
export const uploadDocuments = uploadMultiple('documents', {
  allowedMimeTypes: [...FileTypes.DOCUMENTS, ...FileTypes.IMAGES] as string[],
  maxFileSize: FileSizeLimits.LARGE,
  maxFiles: 10,
});

/**
 * Error handling middleware for multer errors
 */
export const handleUploadErrors = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart data';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields in form data';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
    }
    
    next(new ApiError(message, 400));
  } else {
    next(error);
  }
};