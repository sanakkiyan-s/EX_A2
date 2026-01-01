const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || process.env.SUPABASE_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.SUPABASE_PASSWORD,
  database: 'postgres' // Connect to postgres db to create new db
});

const dbName = process.env.DB_NAME || process.env.SUPABASE_DB_NAME || 'task_manager';

async function createDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');
    
    // Check if database exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    
    if (result.rows.length > 0) {
      console.log(`Database '${dbName}' already exists.`);
    } else {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✓ Database '${dbName}' created successfully!`);
    }
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Error creating database:', error.message);
    console.error('\nPlease create the database manually:');
    console.error(`  sudo -u postgres psql -c "CREATE DATABASE ${dbName};"`);
    process.exit(1);
  }
}

createDatabase();

