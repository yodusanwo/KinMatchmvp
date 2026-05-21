DELETE FROM public.rituals
WHERE user_id IS NULL;

ALTER TABLE public.rituals
  ALTER COLUMN user_id SET NOT NULL;
