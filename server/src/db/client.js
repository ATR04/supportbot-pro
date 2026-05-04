const { Pool } = require('pg')
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = require('../config/env')

// ─────────────────────────────────────────────────────────────────────────────
//  YOUR TASK: Create the PostgreSQL connection pool
// ─────────────────────────────────────────────────────────────────────────────
//
//  What is a Pool?
//  A Pool manages multiple client connections to PostgreSQL.
//  Instead of opening/closing a connection for every query (slow),
//  it reuses a set of pre-opened connections (fast).
//
//  Step-by-step:
//
//  1. Create a new Pool using the config values imported above:
//
const pool = new Pool({
    host:             DB_HOST,
    port:             DB_PORT,
    database:         DB_NAME,
    user:             DB_USER,
    password:         DB_PASSWORD,
    ssl:              { rejectUnauthorized: false }, // required for Supabase
    max:              10,      // max simultaneous connections in the pool
    idleTimeoutMillis: 30000,  // close idle connections after 30s (default: 10s)
    connectionTimeoutMillis: 5000, // error if can't get connection within 5s
})
//
//  2. Listen for the 'connect' event to log when a new client connects:
//
pool.on('connect', () => {
    console.log('🐘 New client connected to PostgreSQL')
})

//  3. Listen for the 'error' event so unexpected errors don't crash the app:
//
pool.on('error', (err) => {
    console.error('❌ Unexpected PostgreSQL pool error:', err.message)
})
//
//  4. Export the pool so other files can use it:
//
module.exports = pool
//
//  Docs: https://node-postgres.com/apis/pool
// ─────────────────────────────────────────────────────────────────────────────

// ✏️  Write your code below this line:
