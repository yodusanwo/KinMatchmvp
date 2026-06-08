-- Add 'family' to the friend category enum
ALTER TABLE public.friends
  DROP CONSTRAINT IF EXISTS friends_category_check;

ALTER TABLE public.friends
  ADD CONSTRAINT friends_category_check
  CHECK (category IN ('inner_circle', 'village', 'family', 'acquaintance'));
