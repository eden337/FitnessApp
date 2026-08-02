-- 0005_weight_progress.sql
-- Private daily weight history. One row per user/calendar day keeps chart
-- samples deterministic; writing the same date updates that day's sample.

CREATE TABLE IF NOT EXISTS weight_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_on    DATE NOT NULL,
  weight_kg    NUMERIC(5,2) NOT NULL CHECK (weight_kg BETWEEN 20 AND 300),
  body_fat_pct NUMERIC(4,1) NULL
               CHECK (body_fat_pct IS NULL OR body_fat_pct BETWEEN 3 AND 75),
  notes        TEXT NULL CHECK (notes IS NULL OR char_length(notes) <= 500),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, logged_on)
);

DROP TRIGGER IF EXISTS weight_logs_set_updated_at ON weight_logs;
CREATE TRIGGER weight_logs_set_updated_at
BEFORE UPDATE ON weight_logs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS weight_logs_user_date_idx
  ON weight_logs(user_id, logged_on DESC);
