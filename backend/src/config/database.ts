import { Pool, PoolConfig } from 'pg';
import { config } from './env';

// Use Railway DATABASE_URL if available, otherwise individual config
const poolConfig: PoolConfig = config.database.url 
  ? {
      connectionString: config.database.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: false }, // Railway requires SSL
    }
  : {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
    };

export const pool = new Pool(poolConfig);

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test PostGIS extension
    const result = await client.query('SELECT PostGIS_Version()');
    if (result.rows.length > 0) {
      console.log('✅ PostGIS extension available:', result.rows[0].postgis_version);
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('📊 Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Handle process exit
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);