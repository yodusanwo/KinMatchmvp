ALTER TABLE public.friends
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.friends
  DROP CONSTRAINT IF EXISTS friends_category_check;

ALTER TABLE public.friends
  ADD CONSTRAINT friends_category_check
  CHECK (category IN ('inner_circle', 'village', 'acquaintance'));

UPDATE public.friends
SET category = CASE
  WHEN is_wished_closer = TRUE THEN 'village'
  ELSE 'inner_circle'
END
WHERE category IS NULL;

ALTER TABLE public.friends
  ALTER COLUMN category SET DEFAULT 'inner_circle';

CREATE INDEX IF NOT EXISTS friends_active_idx
  ON public.friends(user_id, archived_at)
  WHERE archived_at IS NULL;
