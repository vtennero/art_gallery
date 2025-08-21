require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

console.log('🚀 Initializing database schema...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initializeDatabase() {
  let client;
  
  try {
    console.log('🔌 Connecting to database...');
    client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Check if paintings table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'paintings'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Paintings table already exists');
      
      // Check and show current table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'paintings' 
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Current table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Show sample data
      const sample = await client.query('SELECT * FROM paintings LIMIT 2');
      console.log(`📊 Table has ${sample.rows.length} sample records`);
      if (sample.rows.length > 0) {
        console.log('📋 Sample record:', sample.rows[0]);
      }
      
    } else {
      console.log('⚠️  Paintings table does not exist. Creating it...');
      
      // Create paintings table
      await client.query(`
        CREATE TABLE paintings (
          id SERIAL PRIMARY KEY,
          href TEXT,
          imagesrc TEXT NOT NULL,
          name TEXT NOT NULL,
          worktype TEXT NOT NULL,
          year INTEGER NOT NULL,
          rank INTEGER NOT NULL DEFAULT 0
        );
      `);
      
      console.log('✅ Paintings table created successfully!');
      
      // Create index on rank for better performance
      await client.query('CREATE INDEX idx_paintings_rank ON paintings(rank DESC);');
      console.log('✅ Index on rank column created');
    }
    
    // Test the actual query used by the application
    console.log('🧪 Testing application query...');
    
    // First check what schema we're in
    const schemaCheck = await client.query('SELECT current_schema()');
    console.log('📋 Current schema:', schemaCheck.rows[0].current_schema);
    
    // Check search path
    const searchPath = await client.query('SHOW search_path');
    console.log('📋 Search path:', searchPath.rows[0].search_path);
    
    // Try the exact query from the application
    const testQuery = await client.query(`
      SELECT id, href, imagesrc as "imageSrc", name, worktype, year, rank 
      FROM paintings 
      ORDER BY rank DESC
    `);
    console.log(`✅ Application query successful - returned ${testQuery.rows.length} rows`);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position
    });
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
