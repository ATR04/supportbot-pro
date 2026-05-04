const express = require('express')
const router  = express.Router()
const pool    = require('../db/client')

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTE 1 — YOUR TASK: GET /api/tickets
//  Returns all tickets, newest first. Supports optional ?category= filter.
// ─────────────────────────────────────────────────────────────────────────────
//
//  Step-by-step:
//
//  1. Read the optional query param:
//       const { category } = req.query
//       // e.g. GET /api/tickets?category=billing
//
//  2. Build the query dynamically:
//       If category is provided:
//         query = 'SELECT id, title, category, priority, status, source, created_at
//                  FROM tickets WHERE category = $1 ORDER BY created_at DESC'
//         params = [category]
//       Else:
//         query = 'SELECT id, title, category, priority, status, source, created_at
//                  FROM tickets ORDER BY created_at DESC'
//         params = []
//
//     Note: We intentionally exclude `description`, `resolution`, and `embedding`
//     from the list view — they're large fields we only need on the detail page.
//
//  3. Run the query:
//       const result = await pool.query(query, params)
//
//  4. Return the rows:
//       res.json({ tickets: result.rows, total: result.rows.length })
//
//  5. Wrap in try/catch → on error return 500
//
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = '';
    let params = [];
    if(category) {
      query = 'SELECT id, title, category, priority, status, source, created_at FROM tickets WHERE category = $1 ORDER BY created_at DESC'
      params = [category]
    } else {
      query = 'SELECT id, title, category, priority, status, source, created_at FROM tickets ORDER BY created_at DESC'
      params = []
    }
    const response = await pool.query(query, params);
    return res.json({ tickets: response.rows, total: response.rows.length });
  } catch(err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  }
})

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTE 2 — YOUR TASK: GET /api/tickets/:id
//  Returns a single ticket with full details (including resolution).
// ─────────────────────────────────────────────────────────────────────────────
//
//  Step-by-step:
//
//  1. Get the id from the URL:
//       const { id } = req.params
//       // e.g. GET /api/tickets/3  → id = "3"
//
//  2. Validate it's a number:
//       if (isNaN(id)) return res.status(400).json({ error: 'id must be a number' })
//
//  3. Query the DB — select everything EXCEPT embedding (it's 1024 numbers, useless in UI):
//       const result = await pool.query(
//         'SELECT id, title, description, resolution, category, priority, status, source, created_at
//          FROM tickets WHERE id = $1',
//         [id]
//       )
//
//  4. If no rows returned → 404:
//       if (result.rows.length === 0)
//         return res.status(404).json({ error: 'Ticket not found' })
//
//  5. Return the single ticket:
//       res.json(result.rows[0])
//
//  6. Wrap in try/catch → on error return 500
//
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  // ✏️ Write your code here:
  try {
    const { id } = req.params;
    if(isNaN(id)) {
      return res.status(400).json({ error: 'id must be a number' });
    }

    const result = await pool.query(
      `SELECT id, title, description, resolution, category, priority, status, source, created_at
        FROM tickets WHERE id = $1`,
      [id]
    )

    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    return res.json(result.rows[0]);
  } catch(err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  }
})

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTE 3 — YOUR TASK: DELETE /api/tickets/:id
//  Deletes a ticket by id. Returns 204 No Content on success.
// ─────────────────────────────────────────────────────────────────────────────
//
//  Step-by-step:
//
//  1. Get id from req.params, validate it's a number (same as Route 2)
//
//  2. Run DELETE query:
//       const result = await pool.query(
//         'DELETE FROM tickets WHERE id = $1 RETURNING id',
//         [id]
//       )
//     RETURNING id gives us back the deleted row so we know if it existed.
//
//  3. If rowCount === 0 → ticket didn't exist → 404
//
//  4. Success → 204 No Content (standard HTTP for "deleted, nothing to return"):
//       res.status(204).send()
//
//  5. Wrap in try/catch → on error return 500
//
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  // ✏️ Write your code here:
  try {
    const { id } = req.params;
    if(isNaN(id)) {
      return res.status(400).json({ error: 'id must be a number' });
    }
    const result = await pool.query(
      'DELETE FROM tickets WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    return res.status(204).send();
  } catch(err) {
    return res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  }
})

module.exports = router
