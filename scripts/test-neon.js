const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testNeonConnection() {
  console.log('🔌 Testing Neon database connection...');
  console.log('📋 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    
    // Test basic connection
    const { rows } = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('🕐 Current database time:', rows[0].current_time);
    
    // Test paintings table
    const { rows: paintings } = await pool.query('SELECT COUNT(*) as count FROM paintings');
    console.log(`📊 Paintings table has ${paintings[0].count} records`);
    
    // Show sample data
    const { rows: sample } = await pool.query('SELECT * FROM paintings LIMIT 2');
    console.log('📋 Sample paintings:');
    console.log(sample);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testNeonConnection();
