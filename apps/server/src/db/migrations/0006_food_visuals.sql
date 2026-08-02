-- Stable artwork identifiers let every food render the same bundled
-- illustration in Hebrew and English without storing asset paths in the API.
ALTER TABLE food_items
  ADD COLUMN IF NOT EXISTS visual_key TEXT NOT NULL DEFAULT 'meal';

ALTER TABLE food_items
  ADD CONSTRAINT food_items_visual_key_format
  CHECK (visual_key ~ '^[a-z][a-z0-9-]*$');
