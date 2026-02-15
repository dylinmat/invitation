const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:znsCaZzhatgTNKHCmIJkwAHbHAOYdrAe@postgres.railway.internal:5432/railway';

const schemaPath = path.join(__dirname, 'db/schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

async function applySchema() {
  console.log('🔌 Connecting to Railway PostgreSQL...');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    console.log('📄 Applying schema...');
    await client.query(schemaSql);
    console.log('✅ Schema applied successfully!');
    
    // Verify by checking tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error applying schema:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();
