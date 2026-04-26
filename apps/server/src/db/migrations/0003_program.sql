-- 0003_program.sql
-- Phase 3 (scaffolding only): the Aba Hatuv program is a 13-week behavioral
-- protocol, not an exchange/portion diet. Shape:
--   program_weeks         — one row per week (1..13), with theme + mission text.
--   program_tasks         — checkable items the user works on that week.
--   food_lists            — named groups (proteins, leptin-carbs, …); a list
--                           is either global to the program or scoped to a
--                           single week (e.g. the week-3 cleanse "vacation").
--   food_items            — items inside a list, with optional portion / notes.
-- Engine + REST + mobile screens land in subsequent phases; this migration
-- exists so the JSON seeds have somewhere to live and so the loader can be
-- developed and tested in isolation.

CREATE TABLE IF NOT EXISTS program_weeks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_version TEXT NOT NULL,
  week_number     SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 52),
  slug            TEXT NOT NULL,
  title_he        TEXT NOT NULL,
  title_en        TEXT NOT NULL,
  mission_he      TEXT NOT NULL,
  mission_en      TEXT NOT NULL,
  rationale_he    TEXT NULL,
  rationale_en    TEXT NULL,
  notes_he        TEXT NULL,
  notes_en        TEXT NULL,
  UNIQUE (program_version, week_number)
);

CREATE TABLE IF NOT EXISTS program_tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id        UUID NOT NULL REFERENCES program_weeks(id) ON DELETE CASCADE,
  ordinal        SMALLINT NOT NULL CHECK (ordinal >= 0),
  kind           TEXT NOT NULL CHECK (kind IN ('required','optional')),
  title_he       TEXT NOT NULL,
  title_en       TEXT NOT NULL,
  description_he TEXT NULL,
  description_en TEXT NULL,
  UNIQUE (week_id, ordinal)
);

CREATE TABLE IF NOT EXISTS food_lists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_version TEXT NOT NULL,
  slug            TEXT NOT NULL,
  name_he         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  description_he  TEXT NULL,
  description_en  TEXT NULL,
  -- NULL = global (applies across the whole program); UUID = scoped to a week.
  week_id         UUID NULL REFERENCES program_weeks(id) ON DELETE CASCADE
);

-- Two unique indexes instead of a composite UNIQUE so NULL week_id is treated
-- as "global" deterministically across versions.
CREATE UNIQUE INDEX IF NOT EXISTS food_lists_global_unique
  ON food_lists(program_version, slug) WHERE week_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS food_lists_week_unique
  ON food_lists(program_version, slug, week_id) WHERE week_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS food_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id    UUID NOT NULL REFERENCES food_lists(id) ON DELETE CASCADE,
  ordinal    SMALLINT NOT NULL CHECK (ordinal >= 0),
  name_he    TEXT NOT NULL,
  name_en    TEXT NOT NULL,
  portion_he TEXT NULL,
  portion_en TEXT NULL,
  notes_he   TEXT NULL,
  notes_en   TEXT NULL,
  UNIQUE (list_id, ordinal)
);

CREATE INDEX IF NOT EXISTS food_items_list_idx ON food_items(list_id);
CREATE INDEX IF NOT EXISTS program_weeks_version_idx
  ON program_weeks(program_version, week_number);
