const OpenAI = require('openai')
const pool = require('../db/client')
const { generateEmbedding } = require('./embeddings')
const { GROQ_API_KEY } = require('../config/env')

// Groq is OpenAI-compatible — same SDK, different baseURL + model
const openai = new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

// ─────────────────────────────────────────────────────────────────────────────
//  FUNCTION 1 — YOUR TASK: Search for similar tickets using vector similarity
// ─────────────────────────────────────────────────────────────────────────────
//
//  This is the "R" in RAG — Retrieval.
//
//  pgvector gives us a new SQL operator: <=>
//  It calculates the *cosine distance* between two vectors.
//  Distance 0 = identical. Distance 2 = completely opposite.
//  We want the LOWEST distance = most similar tickets.
//
//  Step-by-step:
//
//  1. Convert the embedding array to a pgvector string:
//
//       const embeddingStr = '[' + questionEmbedding.join(',') + ']'
//
//  2. Run a SQL query using the <=> operator:
//
//       const result = await pool.query(`
//         SELECT
//           id, title, description, resolution, category, priority,
//           1 - (embedding <=> $1::vector) AS similarity_score
//         FROM tickets
//         WHERE embedding IS NOT NULL
//         ORDER BY embedding <=> $1::vector
//         LIMIT $2
//       `, [embeddingStr, limit])
//
//     What's happening:
//     - `embedding <=> $1::vector`  → cosine distance between stored vector and question vector
//     - `1 - (cosine distance)`     → converts to similarity score (1.0 = perfect match)
//     - `ORDER BY <=>` ascending    → closest (most similar) tickets come first
//     - `LIMIT $2`                  → only return top N results
//
//  3. Return result.rows
//     Each row has: { id, title, description, resolution, category, priority, similarity_score }
//
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finds the most semantically similar tickets to a question.
 * @param {number[]} questionEmbedding - The embedded question vector
 * @param {number} limit - How many similar tickets to return (default: 3)
 * @returns {Promise<object[]>} - Array of similar tickets with similarity_score
 */
async function searchSimilarTickets(questionEmbedding, limit = 3) {
  // ✏️ Write your code here:
  try {
    const embeddingStr = '[' + questionEmbedding.join(',') + ']'
    const result = await pool.query(`
      SELECT
        id, title, description, resolution, category, priority,
        1 - (embedding <=> $1::vector) AS similarity_score
      FROM tickets
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
      `, [embeddingStr, limit]
    );
    if(!result || result.rows.length === 0) {
      return [];
    } else {
      return result.rows;
    }
  } catch(err) {
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  FUNCTION 2 — YOUR TASK: Generate an answer using Claude + retrieved context
// ─────────────────────────────────────────────────────────────────────────────
//
//  This is the "G" in RAG — Generation.
//
//  You'll format the retrieved tickets as context and pass them to Claude.
//  Claude uses this context to give a grounded, accurate answer — not a
//  hallucinated one.
//
//  Step-by-step:
//
//  1. Build a context string from the similar tickets:
//
//       const context = similarTickets.map((t, i) => `
//         [Ticket ${i + 1}] (similarity: ${(t.similarity_score * 100).toFixed(1)}%)
//         Title: ${t.title}
//         Issue: ${t.description}
//         Resolution: ${t.resolution}
//         Category: ${t.category} | Priority: ${t.priority}
//       `).join('\n---\n')
//
//  2. Call Claude with a system prompt and the context + question:
//
//       const message = await anthropic.messages.create({
//         model: 'claude-3-5-haiku-20241022',
//         max_tokens: 1024,
//         system: `You are an expert IT support assistant.
//  You will be given similar past support tickets as context, and a new question.
//  Use the context to provide a clear, actionable resolution.
//  If none of the context tickets are relevant, say so honestly.
//  Always be concise and specific.`,
//         messages: [{
//           role: 'user',
//           content: `Similar past tickets:\n${context}\n\nNew question: ${question}`
//         }]
//       })
//
//  3. Return the response text:
//
//       return message.content[0].text
//
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates an AI answer using Claude, grounded in similar past tickets.
 * @param {string} question - The user's support question
 * @param {object[]} similarTickets - Retrieved tickets from searchSimilarTickets()
 * @returns {Promise<string>} - Claude's answer
 */
async function generateAnswer(question, similarTickets) {
  // ✏️ Write your code here:
  try {
    const context = similarTickets.map((t, i) => `
      [Ticket ${i + 1}] (similarity: ${(t.similarity_score * 100).toFixed(1)}%)
      Title: ${t.title}
      Issue: ${t.description}
      Resolution: ${t.resolution}
      Category: ${t.category} | Priority: ${t.priority}
    `).join('\n---\n');

    const completion = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: `You are an expert IT support assistant.
          You will be given similar past support tickets as context, and a new question.
          Use the context to provide a clear, actionable resolution.
          If none of the context tickets are relevant, say so honestly.
          Always be concise and specific.`
        },
        {
          role: 'user',
          content: `Similar past tickets:\n${context}\n\nNew question: ${question}`
        }
      ]
    })
    return completion.choices[0].message.content
  } catch(err) {
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  RAG PIPELINE — boilerplate, ties the two functions together
// ─────────────────────────────────────────────────────────────────────────────
//  You don't need to change this — it orchestrates the full pipeline:
//  question → embed → search → generate → log → return
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full RAG pipeline: takes a question, returns an AI answer + sources.
 * @param {string} question
 * @returns {Promise<{ answer: string, sources: object[], topScore: number }>}
 */
async function queryRAG(question) {
  // Step 1: Embed the question
  const questionEmbedding = await generateEmbedding(question);

  // Step 2: Find similar tickets
  const similarTickets = await searchSimilarTickets(questionEmbedding, 3)

  // Step 3: Generate answer with Gemini
  const answer = await generateAnswer(question, similarTickets)

  // Step 4: Log the query for analytics
  const topScore = similarTickets[0]?.similarity_score ?? 0
  await pool.query(
    `INSERT INTO query_logs (question, answer, matched_ticket_ids, top_match_score, model_used)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      question,
      answer,
      similarTickets.map(t => t.id),
      topScore,
      'llama-3.1-8b-instant'
    ]
  )

  // Step 5: Feedback loop — save new questions back into the tickets table
  // so future similar questions benefit from this answer.
  // Only save if topScore < 0.80, meaning this was a genuinely new question
  // not already well covered by existing tickets.
  const FEEDBACK_THRESHOLD = 0.80
  if (topScore < FEEDBACK_THRESHOLD) {
    const embeddingStr = '[' + questionEmbedding.join(',') + ']'
    await pool.query(
      `INSERT INTO tickets (title, description, resolution, category, priority, embedding, source)
       VALUES ($1, $2, $3, $4, $5, $6::vector, $7)`,
      [
        question,                // title = the question asked
        question,                // description = same (we only have the question)
        answer,                  // resolution = the AI-generated answer
        'ai_generated',          // category marks it as auto-added
        'low',                   // default priority
        embeddingStr,            // reuse the embedding we already computed — no extra API call
        'user_query'             // source flag so you can filter these out if needed
      ]
    )
    console.log(`📥 New ticket auto-saved from user query (topScore: ${(topScore * 100).toFixed(1)}%)`)
  }

  return {
    answer,
    sources: similarTickets.map(t => ({
      id:             t.id,
      title:          t.title,
      category:       t.category,
      priority:       t.priority,
      similarityScore: parseFloat((t.similarity_score * 100).toFixed(1)),
    })),
    topScore: parseFloat((topScore * 100).toFixed(1)),
  }
}

module.exports = { queryRAG, searchSimilarTickets, generateAnswer }
