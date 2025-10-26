const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:manosKAGptGPXULSkktQDBMdButFToAY@mainline.proxy.rlwy.net:30366/railway',
  ssl: false
});

async function runMigrations() {
  try {
    console.log('🚀 Setting up demo database...');
    
    // Read and execute the table creation script
    const createTablesSQL = fs.readFileSync(path.join(__dirname, 'migrations/001_initial_setup_no_postgis.sql'), 'utf8');
    console.log('📝 Creating tables...');
    await pool.query(createTablesSQL);
    console.log('✅ Tables created successfully');
    
    // Read and execute the sample data script
    const sampleDataSQL = fs.readFileSync(path.join(__dirname, 'migrations/002_sample_data_no_postgis.sql'), 'utf8');
    console.log('📝 Inserting sample data...');
    await pool.query(sampleDataSQL);
    console.log('✅ Sample data inserted successfully');
    
    console.log('🎉 Demo database setup complete!');
    console.log('You can now login with: admin@broodstock.com / Shrimp123!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigrations();