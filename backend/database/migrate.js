const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  console.log('🔄 Starting database migration...');

  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Usage: DATABASE_URL="postgresql://..." node migrate.js');
    process.exit(1);
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false }
      : false
  });

  try {
    // 連接資料庫
    await client.connect();
    console.log('✅ Connected to database');

    // 讀取 SQL 檔案
    const sqlPath = path.join(__dirname, 'init.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📄 SQL file loaded');

    // 執行 SQL
    console.log('🏗️ Executing migration...');
    await client.query(sql);

    console.log('✅ Migration completed successfully');

    // 顯示資料表列表
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log('\n📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    if (error.detail) {
      console.error('Detail:', error.detail);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

// 執行 migration
migrate();
