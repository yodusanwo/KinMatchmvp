-- Q3 barrier selections on user profile for personalization
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS barriers text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_barriers_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_barriers_check CHECK (
    barriers <@ ARRAY[
      'forget',
      'distance',
      'busy',
      'awkward',
      'unsure',
      'one_sided'
    ]::text[]
  );
