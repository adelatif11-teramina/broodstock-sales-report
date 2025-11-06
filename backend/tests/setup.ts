import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/sales_report_test';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Mock file system operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  unlinkSync: jest.fn(),
  existsSync: jest.fn(() => true),
}));

// Mock multer for file uploads
jest.mock('multer', () => {
  const mockMiddleware = (req: any, res: any, next: any) => {
    req.file = {
      filename: 'test-file.pdf',
      originalname: 'test-file.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('fake file content'),
    };
    next();
  };

  const multer = () => ({
    single: () => mockMiddleware,
    array: () => mockMiddleware,
    fields: () => mockMiddleware,
    none: () => mockMiddleware,
    any: () => mockMiddleware,
  });
  
  // Add storage methods
  multer.memoryStorage = () => ({
    getFilename: jest.fn(),
    getDestination: jest.fn(),
  });
  
  multer.diskStorage = () => ({
    getFilename: jest.fn(),
    getDestination: jest.fn(),
  });
  
  return multer;
});