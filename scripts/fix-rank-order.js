const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function fixRankOrder() {
  try {
    console.log('🔍 Fetching current paintings with ranks...');
    
    // Get all paintings ordered by current rank (descending to maintain order)
    const result = await pool.query(
      'SELECT id, name, rank FROM paintings ORDER BY rank DESC'
    );
    
    console.log(`📋 Found ${result.rows.length} paintings`);
    console.log('Current ranks:', result.rows.map(r => r.rank));
    
    if (result.rows.length === 0) {
      console.log('No paintings found in database');
      return;
    }
    
    // Calculate new ranks starting from 1
    const updates = result.rows.map((row, index) => ({
      id: row.id,
      name: row.name,
      oldRank: row.rank,
      newRank: result.rows.length - index // Reverse the order so highest current rank becomes 1
    }));
    
    console.log('\n📝 Rank updates:');
    updates.forEach(update => {
      console.log(`${update.name}: ${update.oldRank} → ${update.newRank}`);
    });
    
    // Update each painting with its new rank
    console.log('\n🔄 Updating ranks...');
    for (const update of updates) {
      await pool.query(
        'UPDATE paintings SET rank = $1 WHERE id = $2',
        [update.newRank, update.id]
      );
      console.log(`✅ Updated "${update.name}" from rank ${update.oldRank} to ${update.newRank}`);
    }
    
    console.log('\n✅ Rank update completed successfully!');
    console.log('🎨 Your paintings are now ranked from 1 to', result.rows.length);
    
  } catch (error) {
    console.error('❌ Error updating ranks:', error);
  } finally {
    await pool.end();
  }
}

fixRankOrder();
