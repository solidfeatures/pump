-- PHO-001: Progress photos table
CREATE TABLE IF NOT EXISTS progress_photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL,
  storage_path TEXT NOT NULL,
  angle        TEXT NOT NULL DEFAULT 'Frente',
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS for single-user app
ALTER TABLE progress_photos DISABLE ROW LEVEL SECURITY;

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_progress_photos_date ON progress_photos (date DESC);
