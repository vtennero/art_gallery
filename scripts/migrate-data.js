const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Neon client
const neonPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrateData() {
  try {
    console.log('🔄 Starting data migration from Supabase to Neon...');
    
    // 1. Fetch data from Supabase
    console.log('📥 Fetching data from Supabase...');
    const { data: supabaseData, error } = await supabase
      .from('swag')
      .select('*')
      .order('id');
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    console.log(`✅ Found ${supabaseData.length} records in Supabase`);
    
    // 2. Create table in Neon if it doesn't exist
    console.log('🏗️ Creating table in Neon...');
    await neonPool.query(`
      CREATE TABLE IF NOT EXISTS paintings (
        id SERIAL PRIMARY KEY,
        href TEXT,
        imageSrc TEXT NOT NULL,
        name TEXT NOT NULL,
        worktype TEXT NOT NULL,
        year INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // 3. Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data from Neon...');
    await neonPool.query('DELETE FROM paintings');
    
    // 4. Insert data into Neon
    console.log('📤 Inserting data into Neon...');
    for (const record of supabaseData) {
      await neonPool.query(`
        INSERT INTO paintings (id, href, imageSrc, name, worktype, year)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [record.id, record.href, record.imageSrc, record.name, record.worktype, record.year]);
    }
    
    // 5. Verify migration
    console.log('🔍 Verifying migration...');
    const { rows } = await neonPool.query('SELECT COUNT(*) as count FROM paintings');
    console.log(`✅ Successfully migrated ${rows[0].count} records to Neon`);
    
    // 6. Show sample data
    const { rows: sampleData } = await neonPool.query('SELECT * FROM paintings LIMIT 3');
    console.log('📋 Sample data from Neon:');
    console.log(sampleData);
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await neonPool.end();
  }
}

migrateData();
