const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addRankColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔧 Adding rank column to paintings table...');
    
    // 1. Add the rank column
    await pool.query(`
      ALTER TABLE paintings 
      ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0
    `);
    
    console.log('✅ Rank column added');
    
    // 2. Update existing records with their current ID as rank (so they maintain current order)
    console.log('📝 Updating existing records with rank values...');
    await pool.query(`
      UPDATE paintings 
      SET rank = id 
      WHERE rank = 0 OR rank IS NULL
    `);
    
    // 3. Verify the update
    const { rows } = await pool.query(`
      SELECT id, rank, name FROM paintings 
      ORDER BY rank DESC 
      LIMIT 5
    `);
    
    console.log('📊 Sample records with rank (sorted by rank DESC):');
    console.log(rows);
    
    // 4. Show total count
    const { rows: countResult } = await pool.query('SELECT COUNT(*) as count FROM paintings');
    console.log(`✅ Updated ${countResult[0].count} records with rank values`);
    
    console.log('🎉 Rank column setup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addRankColumn();
