-- 0004_program_start.sql
-- Anchors each user's personal Aba Hatuv timeline. NULL means the user may
-- preview week 1 but has not started or resumed the program yet.

ALTER TABLE user_metrics
  ADD COLUMN IF NOT EXISTS program_started_on DATE NULL;
