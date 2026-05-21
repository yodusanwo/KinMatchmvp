ALTER TABLE public.held_relationships
  ALTER COLUMN threshold_days SET DEFAULT 14;

UPDATE public.held_relationships
SET threshold_days = 14
WHERE threshold_days = 10;
