-- 0007_shared_activities.sql
-- Explicitly shared, privacy-safe couple wins. Body measurements, calorie
-- values, and private program/profile fields have no columns in this table.

CREATE TABLE IF NOT EXISTS shared_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id     UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (
    kind IN ('hydration', 'vegetables', 'movement', 'meal_together', 'encouragement')
  ),
  note          TEXT NULL CHECK (note IS NULL OR char_length(note) BETWEEN 1 AND 160),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shared_activities_couple_created_idx
  ON shared_activities(couple_id, created_at DESC, id DESC);
