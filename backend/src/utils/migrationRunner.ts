import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

export interface Migration {
  id: string;
  filename: string;
  sql: string;
}

export class MigrationRunner {
  private migrationsPath: string;
  
  constructor() {
    this.migrationsPath = path.join(process.cwd(), 'migrations');
  }

  /**
   * Create migrations table if it doesn't exist
   */
  private async createMigrationsTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await pool.query(createTableQuery);
  }

  /**
   * Get all migration files from the migrations directory
   */
  private getMigrationFiles(): Migration[] {
    if (!fs.existsSync(this.migrationsPath)) {
      console.log('No migrations directory found');
      return [];
    }

    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure files are processed in order

    return files.map(filename => {
      const filePath = path.join(this.migrationsPath, filename);
      const sql = fs.readFileSync(filePath, 'utf8');
      const id = filename.replace('.sql', '');
      
      return { id, filename, sql };
    });
  }

  /**
   * Get list of already applied migrations
   */
  private async getAppliedMigrations(): Promise<string[]> {
    try {
      const result = await pool.query('SELECT id FROM migrations ORDER BY applied_at');
      return result.rows.map(row => row.id);
    } catch (error) {
      // Table doesn't exist yet
      return [];
    }
  }

  /**
   * Apply a single migration
   */
  private async applyMigration(migration: Migration): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Execute the migration SQL
      await client.query(migration.sql);
      
      // Record that this migration was applied
      await client.query(
        'INSERT INTO migrations (id, filename) VALUES ($1, $2)',
        [migration.id, migration.filename]
      );
      
      await client.query('COMMIT');
      console.log(`✅ Applied migration: ${migration.filename}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed to apply migration ${migration.filename}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      console.log('🚀 Starting database migrations...');
      
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();
      
      // Get all migration files and applied migrations
      const migrations = this.getMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations();
      
      // Filter out already applied migrations
      const pendingMigrations = migrations.filter(
        migration => !appliedMigrations.includes(migration.id)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }
      
      console.log(`📝 Found ${pendingMigrations.length} pending migration(s)`);
      
      // Apply each pending migration
      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }
      
      console.log('✅ All migrations completed successfully');
      
    } catch (error) {
      console.error('💥 Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<void> {
    try {
      await this.createMigrationsTable();
      
      const migrations = this.getMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations();
      
      console.log('\n📊 Migration Status:');
      console.log('==================');
      
      if (migrations.length === 0) {
        console.log('No migration files found');
        return;
      }
      
      migrations.forEach(migration => {
        const isApplied = appliedMigrations.includes(migration.id);
        const status = isApplied ? '✅ Applied' : '⏳ Pending';
        console.log(`${status} - ${migration.filename}`);
      });
      
      const pendingCount = migrations.length - appliedMigrations.length;
      console.log(`\nTotal migrations: ${migrations.length}`);
      console.log(`Applied: ${appliedMigrations.length}`);
      console.log(`Pending: ${pendingCount}`);
      
    } catch (error) {
      console.error('❌ Failed to get migration status:', error);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new MigrationRunner();
  const command = process.argv[2];
  
  (async () => {
    try {
      switch (command) {
        case 'run':
          await runner.runMigrations();
          break;
        case 'status':
          await runner.getStatus();
          break;
        default:
          console.log('Usage:');
          console.log('  npm run migrate run    - Run pending migrations');
          console.log('  npm run migrate status - Show migration status');
      }
    } catch (error) {
      process.exit(1);
    } finally {
      await pool.end();
    }
  })();
}