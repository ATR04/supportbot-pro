const express = require('express')
const router  = express.Router()
const { queryRAG } = require('../services/rag')

// POST /api/query
// Body: { question: "My app keeps crashing on Windows 11" }
router.post('/', async (req, res) => {
  const { question } = req.body

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: 'question is required and must be a non-empty string' })
  }

  if (question.trim().length > 1000) {
    return res.status(400).json({ error: 'question must be under 1000 characters' })
  }

  try {
    const result = await queryRAG(question.trim())
    res.json(result)
  } catch (err) {
    console.error('[query] RAG pipeline error:', err.message)
    res.status(500).json({ error: 'Failed to process query', detail: err.message })
  }
})

module.exports = router
