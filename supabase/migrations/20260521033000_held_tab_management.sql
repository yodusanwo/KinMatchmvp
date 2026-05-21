ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS held_quiet_threshold_days int NOT NULL DEFAULT 14;

ALTER TABLE public.held_relationships
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS friend_id uuid REFERENCES public.friends(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS invited_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_notified_at timestamptz;

UPDATE public.held_relationships
SET
  user_id = COALESCE(user_id, holder_user_id),
  friend_id = COALESCE(friend_id, held_friend_id),
  invited_at = COALESCE(invited_at, created_at);

ALTER TABLE public.held_relationships
  DROP CONSTRAINT IF EXISTS held_relationships_status_check;

ALTER TABLE public.held_relationships
  ADD CONSTRAINT held_relationships_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'active', 'paused'));

UPDATE public.held_relationships
SET
  status = CASE
    WHEN status = 'active' THEN 'accepted'
    ELSE status
  END,
  accepted_at = CASE
    WHEN status = 'active' THEN COALESCE(accepted_at, invited_at, created_at)
    ELSE accepted_at
  END;

CREATE INDEX IF NOT EXISTS held_relationships_active_idx
  ON public.held_relationships(user_id, archived_at)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS held_relationships_friend_active_idx
  ON public.held_relationships(user_id, friend_id, archived_at)
  WHERE archived_at IS NULL;
