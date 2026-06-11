-- Allow users to set custom initials for a friend's avatar.
-- When null, the app derives initials from the friend's name.
ALTER TABLE public.friends
ADD COLUMN IF NOT EXISTS avatar_initials text;
