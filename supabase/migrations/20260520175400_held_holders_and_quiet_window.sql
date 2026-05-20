ALTER TABLE public.friends
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.held_relationships
  ADD COLUMN IF NOT EXISTS setup_notified_at timestamptz;

ALTER TABLE public.held_relationships
  ADD COLUMN IF NOT EXISTS setup_notification_error text;
