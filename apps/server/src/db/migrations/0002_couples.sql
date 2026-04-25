-- 0002_couples.sql
-- Phase 2: couple-pairing entities. A `couple` is the sync unit; each user
-- belongs to at most one couple at a time. The partial unique index on
-- couple_members enforces that without leaning on application-level guards.

CREATE TABLE IF NOT EXISTS couples (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS couple_members (
  couple_id  UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner','member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (couple_id, user_id)
);

-- A user can belong to at most one active couple.
CREATE UNIQUE INDEX IF NOT EXISTS couple_members_user_unique
  ON couple_members(user_id);
