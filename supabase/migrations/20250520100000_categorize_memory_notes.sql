-- Re-categorize memory notes: drop old tag constraint before updates
ALTER TABLE memory_notes DROP CONSTRAINT IF EXISTS memory_notes_tag_check;
ALTER TABLE memory_notes DROP CONSTRAINT IF EXISTS valid_memory_tag;

UPDATE memory_notes SET tag = 'people'  WHERE tag = 'family';
UPDATE memory_notes SET tag = 'dates'   WHERE tag = 'milestone';
UPDATE memory_notes SET tag = 'current' WHERE tag IN ('work', 'health');
UPDATE memory_notes SET tag = 'loves'   WHERE tag = 'interest';
-- 'other' stays as 'other'

ALTER TABLE memory_notes
  ADD CONSTRAINT valid_memory_tag
  CHECK (tag IN ('people', 'dates', 'current', 'loves', 'shared', 'trusted', 'other'));

ALTER TABLE memory_notes
  ADD COLUMN IF NOT EXISTS event_date DATE;

-- Allow paste_extraction source
ALTER TABLE memory_notes DROP CONSTRAINT IF EXISTS memory_notes_source_check;

ALTER TABLE memory_notes
  ADD CONSTRAINT memory_notes_source_check
  CHECK (source IN ('manual', 'voice_extraction', 'paste_extraction', 'add_connection'));
