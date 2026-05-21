ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS daily_checkin_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS sunday_voice_drop_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS held_alerts_enabled boolean DEFAULT true;

UPDATE public.users
SET
  daily_checkin_enabled = COALESCE(
    daily_checkin_enabled,
    (email_preferences->>'daily_checkin')::boolean,
    true
  ),
  sunday_voice_drop_enabled = COALESCE(
    sunday_voice_drop_enabled,
    (email_preferences->>'sunday_voice_drop')::boolean,
    true
  ),
  held_alerts_enabled = COALESCE(
    held_alerts_enabled,
    (email_preferences->>'held_alerts')::boolean,
    true
  );
