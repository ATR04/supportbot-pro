const express = require('express')
const cors    = require('cors')
const morgan  = require('morgan')
const { PORT, NODE_ENV } = require('./config/env')

// ─── Import route modules ─────────────────────────────────────────────────────
const healthRouter = require('./routes/health')
const queryRouter   = require('./routes/query')
const ticketsRouter = require('./routes/tickets')
// const ingestRouter = require('./routes/ingest')

// ─── App setup ────────────────────────────────────────────────────────────────
const app = express()

// Middleware — allow requests from Vercel frontend and localhost
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  // Vercel domains (add your exact URL after deploying)
  /\.vercel\.app$/,
]
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Render health checks, same-origin)
    if (!origin) return callback(null, true)
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    )
    callback(null, allowed)
  },
  credentials: true,
}))
app.use(express.json())
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health',  healthRouter)
app.use('/api/query',   queryRouter)
app.use('/api/tickets', ticketsRouter)
// app.use('/api/ingest',  ingestRouter)    // Step 2

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.message)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ SupportBot Pro server running on http://localhost:${PORT}`)
  console.log(`   Environment: ${NODE_ENV}`)
})
