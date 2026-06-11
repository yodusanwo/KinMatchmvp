-- Allow users to pick a custom avatar color for a friend.
-- When null, the app falls back to a deterministic color derived from the name.
ALTER TABLE public.friends
ADD COLUMN IF NOT EXISTS avatar_color_hex text;
