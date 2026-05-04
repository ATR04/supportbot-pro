/**
 * db/setup.js
 * Run once to create tables and indexes:  npm run db:setup
 */

const fs   = require('fs')
const path = require('path')
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     process.env.DB_PORT     || 5432,
        database: process.env.DB_NAME     || 'supportbot_db',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || '',
      }
)

async function setup() {
  console.log('🔧 Running database setup...\n')

  // Read the schema file
  const schemaPath = path.join(__dirname, 'schema.sql')
  const sql = fs.readFileSync(schemaPath, 'utf8')

  try {
    await pool.query(sql)
    console.log('✅ Schema applied successfully!')
    console.log('   Tables created: tickets, query_logs')
    console.log('   Indexes created: embedding (ivfflat), category, status')
  } catch (err) {
    console.error('❌ Setup failed:', err.message)
    console.error('\nCommon fixes:')
    console.error('  • Make sure PostgreSQL is running')
    console.error('  • Make sure the database exists:  createdb supportbot_db')
    console.error('  • Make sure pgvector is installed: https://github.com/pgvector/pgvector')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

setup()
