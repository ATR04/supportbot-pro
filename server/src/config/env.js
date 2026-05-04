require('dotenv').config()

// Centralised config — import this instead of process.env directly
module.exports = {
  // Server
  PORT:     process.env.PORT     || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // PostgreSQL — prefer DATABASE_URL (Railway), fall back to individual vars (local)
  DATABASE_URL: process.env.DATABASE_URL || null,
  DB_HOST:      process.env.DB_HOST     || 'localhost',
  DB_PORT:      parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME:      process.env.DB_NAME     || 'supportbot_db',
  DB_USER:      process.env.DB_USER     || 'postgres',
  DB_PASSWORD:  process.env.DB_PASSWORD || '',

  // Groq (free LLM — llama-3.1-8b-instant)
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  // Voyage AI (embeddings)
  VOYAGE_API_KEY: process.env.VOYAGE_API_KEY || '',
}
