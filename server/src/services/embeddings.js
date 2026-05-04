const { VOYAGE_API_KEY } = require('../config/env')

// ─────────────────────────────────────────────────────────────────────────────
//  YOUR TASK: Generate an embedding vector for a given text
// ─────────────────────────────────────────────────────────────────────────────
//
//  What is an embedding?
//  An embedding converts text into an array of numbers (a vector).
//  Similar text produces similar vectors — this is what makes semantic
//  search possible. "Server is down" and "website not loading" will have
//  close vectors even though they share no words.
//
//  We use Voyage AI's API to generate embeddings.
//  Model: voyage-2  →  returns a 1024-dimension vector  (matches our schema)
//
//  Step-by-step:
//
//  1. Make a POST request to Voyage AI:
//
//       const response = await fetch('https://api.voyageai.com/v1/embeddings', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${VOYAGE_API_KEY}`,
//         },
//         body: JSON.stringify({
//           input: [text],      // array of strings
//           model: 'voyage-2',
//         }),
//       })
//
//  2. Parse the JSON response:
//
//       const data = await response.json()
//
//  3. Return the embedding array:
//
//       return data.data[0].embedding
//       // This is an array of 1024 numbers, e.g. [0.023, -0.14, 0.87, ...]
//
//  4. Wrap in try/catch and throw a clear error if it fails:
//
//       if (!response.ok) {
//         throw new Error(`Voyage AI error: ${data.detail || response.statusText}`)
//       }
//
//  Voyage AI docs: https://docs.voyageai.com/reference/embeddings-api
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a text string into a 1024-dimension embedding vector.
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - Array of 1024 numbers
 */
async function generateEmbedding(text) {
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: [text],
        model: 'voyage-2',
      }),
    });

    const data = await response.json();
    if(!response.ok) {
      throw new Error(`Voyage AI error: ${data.detail || response.statusText}`)
    }
    return data.data[0].embedding;
  } catch(err) {
    throw err;
  }
}

module.exports = { generateEmbedding }
