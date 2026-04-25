-- 0001_init.sql
-- Phase 1: auth + profile schema. Establishes users, user_metrics (1:1),
-- and rotating refresh_tokens. Subsequent phases will extend with couples,
-- meal/water/weight logs, and Aba Hatuv reference data.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- updated_at trigger helper -------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  locale        TEXT NOT NULL DEFAULT 'he'
                CHECK (locale IN ('he','en')),
  gender        TEXT NOT NULL
                CHECK (gender IN ('female','male','other')),
  birth_date    DATE NOT NULL,
  height_cm     SMALLINT NOT NULL CHECK (height_cm BETWEEN 50 AND 250),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- user_metrics --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_metrics (
  user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_weight_kg    NUMERIC(5,2) NOT NULL CHECK (current_weight_kg BETWEEN 20 AND 300),
  activity_level       TEXT NOT NULL
                       CHECK (activity_level IN ('sedentary','light','moderate','high','athlete')),
  goal_type            TEXT NOT NULL
                       CHECK (goal_type IN ('lose','maintain','gain')),
  goal_weight_kg       NUMERIC(5,2) NULL CHECK (goal_weight_kg IS NULL OR goal_weight_kg BETWEEN 20 AND 300),
  dietary_restrictions JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS user_metrics_set_updated_at ON user_metrics;
CREATE TRIGGER user_metrics_set_updated_at
BEFORE UPDATE ON user_metrics
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- refresh_tokens ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx
  ON refresh_tokens(user_id) WHERE revoked_at IS NULL;
