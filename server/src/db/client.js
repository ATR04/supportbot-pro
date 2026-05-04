const { Pool } = require('pg')
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = require('../config/env')

// Use DATABASE_URL (Railway internal) when available,
// otherwise fall back to individual vars (local development)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: false, // Railway internal network — no SSL needed
      }
    : {
        host:     DB_HOST,
        port:     DB_PORT,
        database: DB_NAME,
        user:     DB_USER,
        password: DB_PASSWORD,
      }
)

pool.on('connect', () => console.log('🐘 New client connected to PostgreSQL'))
pool.on('error',   (err) => console.error('❌ PostgreSQL pool error:', err.message))

module.exports = pool
