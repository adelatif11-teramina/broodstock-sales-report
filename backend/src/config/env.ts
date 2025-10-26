import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'broodstock_sales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    url: process.env.DATABASE_URL, // Railway connection string
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // File Storage
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    bucket: process.env.S3_BUCKET || 'broodstock-files',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT,
  },
  
  // External APIs
  geocoding: {
    apiKey: process.env.GEOCODING_API_KEY,
    provider: process.env.GEOCODING_PROVIDER || 'openstreetmap',
  },
  
  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  corsOrigins: (() => {
    const raw = process.env.CORS_ORIGIN;
    if (!raw || raw.trim().length === 0) {
      return ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
    }

    if (raw.trim() === '*') {
      return '*';
    }

    return raw
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean);
  })(),
  
  // Pagination
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20'),
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100'),
} as const;

export type Config = typeof config;
