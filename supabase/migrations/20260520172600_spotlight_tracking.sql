-- Track when each friend was last spotlighted (for fatigue calculation).
ALTER TABLE public.friends
  ADD COLUMN IF NOT EXISTS last_spotlight_at timestamptz;

-- The current schema calls touchpoints "interactions"; keep both paths safe.
ALTER TABLE IF EXISTS public.interactions
  ADD COLUMN IF NOT EXISTS direction text
  CHECK (direction IN ('outbound', 'inbound'))
  DEFAULT 'outbound';

ALTER TABLE IF EXISTS public.touchpoints
  ADD COLUMN IF NOT EXISTS direction text
  CHECK (direction IN ('outbound', 'inbound'))
  DEFAULT 'outbound';

CREATE TABLE IF NOT EXISTS public.spotlight_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  friend_id uuid REFERENCES public.friends(id) ON DELETE CASCADE NOT NULL,
  spotlight_at timestamptz DEFAULT now(),
  total_score numeric NOT NULL,
  component_scores jsonb NOT NULL,
  action text CHECK (action IN ('engaged', 'skipped', 'snoozed', 'replaced')),
  action_at timestamptz
);

CREATE INDEX IF NOT EXISTS spotlight_feedback_user_idx
  ON public.spotlight_feedback(user_id);

CREATE INDEX IF NOT EXISTS spotlight_feedback_friend_idx
  ON public.spotlight_feedback(friend_id);

ALTER TABLE public.spotlight_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS spotlight_feedback_select_own ON public.spotlight_feedback;
DROP POLICY IF EXISTS spotlight_feedback_insert_own ON public.spotlight_feedback;
DROP POLICY IF EXISTS spotlight_feedback_update_own ON public.spotlight_feedback;

CREATE POLICY spotlight_feedback_select_own ON public.spotlight_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY spotlight_feedback_insert_own ON public.spotlight_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY spotlight_feedback_update_own ON public.spotlight_feedback
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
