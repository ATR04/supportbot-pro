const express = require('express')
const router  = express.Router()
const pool    = require('../db/client')

// ─────────────────────────────────────────────────────────────────────────────
//  YOUR TASK: Build the health-check endpoint
//  GET /api/health
// ─────────────────────────────────────────────────────────────────────────────
//
//  This route does two things:
//    1. Proves the Express server is running
//    2. Proves the database is reachable
//
//  Step-by-step:
//
//  1. Define an async GET handler:
//
//       router.get('/', async (req, res) => { ... })
//
//  2. Inside the handler, query the DB with:
//
//       const result = await pool.query('SELECT NOW() AS current_time')
//
//     SELECT NOW() returns the current timestamp from Postgres.
//     It's the simplest possible query — if it succeeds, the DB is up.
//
//  3. On success, respond with HTTP 200:
//
//       res.json({
//         status:    'ok',
//         database:  'connected',
//         timestamp: result.rows[0].current_time,
//       })
//
//  4. Wrap everything in try/catch.
//     On error, respond with HTTP 503 (Service Unavailable):
//
//       res.status(503).json({
//         status:   'error',
//         database: 'disconnected',
//         error:    err.message,
//       })
//
//  Why 503 and not 500?
//  500 = something broke in YOUR code.
//  503 = a downstream service (the DB) is unavailable. More accurate here.
//
//  Test it once you're done:
//    curl http://localhost:3001/api/health
// ─────────────────────────────────────────────────────────────────────────────

// ✏️  Write your route handler below this line:

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() AS current_time');
        if(result) {
            res.json({
                status:    'ok',
                database:  'connected',
                timestamp: result.rows[0].current_time,
            })
        } else {
            throw new Error('Error querying database')
        }
    } catch(err) {
        res.status(503).json({
            status:   'error',
            database: 'disconnected',
            error:    err.message,
        })
    }
})


module.exports = router
