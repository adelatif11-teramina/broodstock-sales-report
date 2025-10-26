import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/errorHandler';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { 
  uploadDocuments, 
  uploadCredentials, 
  uploadProductPhotos,
  handleUploadErrors 
} from '../middleware/fileUpload';
import { fileStorage, FileTypes, FileSizeLimits } from '../utils/fileStorage';
import { config } from '../config/env';

const router = Router();

// All file routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/files/upload/documents
 * Upload general documents
 */
router.post(
  '/upload/documents',
  uploadRateLimiter,
  authorize(['editor', 'manager', 'admin']),
  uploadDocuments,
  handleUploadErrors,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      throw new ApiError('No files uploaded', 400);
    }

    const files = Array.isArray(req.files) ? req.files : [req.files].flat();
    const uploadResults = [];

    try {
      for (const file of files) {
        const result = await fileStorage.storeFile(file as any, {
          allowedMimeTypes: [...FileTypes.DOCUMENTS, ...FileTypes.IMAGES] as string[],
          maxFileSize: FileSizeLimits.LARGE,
        });
        uploadResults.push(result);
      }

      res.json({
        success: true,
        message: `${uploadResults.length} file(s) uploaded successfully`,
        data: {
          files: uploadResults,
        },
      });
    } catch (error) {
      // Clean up any files that were successfully uploaded
      for (const result of uploadResults) {
        try {
          await fileStorage.deleteFile(result.filename);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      throw error;
    }
  })
);

/**
 * POST /api/v1/files/upload/credentials
 * Upload customer credential documents
 */
router.post(
  '/upload/credentials',
  uploadRateLimiter,
  authorize(['editor', 'manager', 'admin']),
  uploadCredentials,
  handleUploadErrors,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      throw new ApiError('No credential files uploaded', 400);
    }

    const files = Array.isArray(req.files) ? req.files : [req.files].flat();
    const uploadResults = [];

    try {
      for (const file of files) {
        const result = await fileStorage.storeFile(file as any, {
          allowedMimeTypes: [...FileTypes.CREDENTIALS] as string[],
          maxFileSize: FileSizeLimits.LARGE,
        });
        uploadResults.push(result);
      }

      res.json({
        success: true,
        message: `${uploadResults.length} credential file(s) uploaded successfully`,
        data: {
          files: uploadResults,
        },
      });
    } catch (error) {
      // Clean up any files that were successfully uploaded
      for (const result of uploadResults) {
        try {
          await fileStorage.deleteFile(result.filename);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      throw error;
    }
  })
);

/**
 * POST /api/v1/files/upload/photos
 * Upload product/broodstock photos
 */
router.post(
  '/upload/photos',
  uploadRateLimiter,
  authorize(['editor', 'manager', 'admin']),
  uploadProductPhotos,
  handleUploadErrors,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      throw new ApiError('No photo files uploaded', 400);
    }

    const files = Array.isArray(req.files) ? req.files : [req.files].flat();
    const uploadResults = [];

    try {
      for (const file of files) {
        const result = await fileStorage.storeFile(file as any, {
          allowedMimeTypes: [...FileTypes.IMAGES] as string[],
          maxFileSize: FileSizeLimits.MEDIUM,
        });
        uploadResults.push(result);
      }

      res.json({
        success: true,
        message: `${uploadResults.length} photo(s) uploaded successfully`,
        data: {
          files: uploadResults,
        },
      });
    } catch (error) {
      // Clean up any files that were successfully uploaded
      for (const result of uploadResults) {
        try {
          await fileStorage.deleteFile(result.filename);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      throw error;
    }
  })
);

/**
 * GET /api/v1/files/:filename
 * Serve uploaded files (for local storage)
 */
router.get(
  '/:filename',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { filename } = req.params;
    
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new ApiError('Invalid filename', 400);
    }

    if (config.storage.type === 's3') {
      // For S3 storage, redirect to signed URL
      try {
        const signedUrl = await fileStorage.generateSignedUrl(`uploads/${filename}`);
        res.redirect(signedUrl);
        return;
      } catch (error) {
        throw new ApiError('File not found', 404);
      }
    } else {
      // For local storage, serve file directly
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      if (!fs.existsSync(filePath)) {
        throw new ApiError('File not found', 404);
      }

      // Set appropriate headers
      const stat = fs.statSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      // Set content type based on file extension
      const mimeTypes: { [key: string]: string } = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  })
);

/**
 * DELETE /api/v1/files/:filename
 * Delete an uploaded file
 */
router.delete(
  '/:filename',
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { filename } = req.params;
    
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new ApiError('Invalid filename', 400);
    }

    try {
      if (config.storage.type === 's3') {
        await fileStorage.deleteFile(`uploads/${filename}`);
      } else {
        await fileStorage.deleteFile(filename);
      }

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      throw new ApiError('File not found or could not be deleted', 404);
    }
  })
);

/**
 * GET /api/v1/files/signed-url/:filename
 * Generate a signed URL for accessing a file (S3 only)
 */
router.get(
  '/signed-url/:filename',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { filename } = req.params;
    const { expires } = req.query;
    
    if (config.storage.type !== 's3') {
      throw new ApiError('Signed URLs are only available for S3 storage', 400);
    }

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new ApiError('Invalid filename', 400);
    }

    const expiresIn = expires ? parseInt(expires as string) : 3600; // Default 1 hour
    
    if (isNaN(expiresIn) || expiresIn < 60 || expiresIn > 604800) { // Between 1 minute and 7 days
      throw new ApiError('Invalid expires parameter. Must be between 60 and 604800 seconds', 400);
    }

    try {
      const signedUrl = await fileStorage.generateSignedUrl(`uploads/${filename}`, expiresIn);
      
      res.json({
        success: true,
        data: {
          signedUrl,
          expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        },
      });
    } catch (error) {
      throw new ApiError('Could not generate signed URL', 500);
    }
  })
);

/**
 * GET /api/v1/files/info
 * Get file storage configuration info
 */
router.get(
  '/info',
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      data: {
        storageType: config.storage.type,
        maxFileSizes: {
          small: FileSizeLimits.SMALL,
          medium: FileSizeLimits.MEDIUM,
          large: FileSizeLimits.LARGE,
          xlarge: FileSizeLimits.XLARGE,
        },
        allowedFileTypes: {
          images: FileTypes.IMAGES,
          documents: FileTypes.DOCUMENTS,
          credentials: FileTypes.CREDENTIALS,
        },
      },
    });
  })
);

export default router;