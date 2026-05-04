-- ─────────────────────────────────────────────────────────────────────────────
--  SupportBot Pro — PostgreSQL Schema
--  Run via:  npm run db:setup   (inside /server)
-- ─────────────────────────────────────────────────────────────────────────────

-- pgvector gives PostgreSQL the ability to store and search vector embeddings.
-- This is the heart of our RAG pipeline.
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── tickets ─────────────────────────────────────────────────────────────────
-- Stores historical support tickets (our "knowledge base").
-- Each ticket gets embedded so we can do similarity search later.

CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  -- The original ticket content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  -- How it was resolved (this is what the AI will use as the answer)
  resolution TEXT,
  -- Metadata
  category TEXT,                          -- e.g. 'billing', 'technical', 'account'
  priority TEXT DEFAULT 'medium',         -- 'low' | 'medium' | 'high' | 'critical'
  status TEXT DEFAULT 'resolved',       -- 'open' | 'pending' | 'resolved'
  source TEXT DEFAULT 'manual',         -- 'manual' | 'imported' | 'api'
  -- The embedding vector (1024 dims for Voyage AI voyage-2 model)
  -- This is what pgvector uses to find semantically similar tickets
  embedding vector(1024),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── query_logs ──────────────────────────────────────────────────────────────
-- Logs every question asked through the AI interface.
-- Useful for analytics and improving the system over time.

CREATE TABLE IF NOT EXISTS query_logs (
  id              SERIAL PRIMARY KEY,
  question        TEXT        NOT NULL,
  answer          TEXT,
  matched_ticket_ids  INTEGER[],           -- which tickets were retrieved
  top_match_score FLOAT,                   -- cosine similarity of best match
  model_used      TEXT,                    -- e.g. 'claude-3-5-haiku-20241022'
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
-- ivfflat index for fast approximate nearest-neighbor (ANN) search.
-- Without this, every query would scan ALL rows (slow at scale).
-- 'lists = 100' is a good starting point for up to ~1M vectors.

CREATE INDEX IF NOT EXISTS tickets_embedding_idx
  ON tickets
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Regular index on category for filtered searches
CREATE INDEX IF NOT EXISTS tickets_category_idx ON tickets (category);
CREATE INDEX IF NOT EXISTS tickets_status_idx   ON tickets (status);

-- ─── Auto-update updated_at ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
