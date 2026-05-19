CREATE TABLE IF NOT EXISTS public.plan_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_token text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.friends (id) ON DELETE CASCADE,
  message text,
  option_1_datetime timestamptz NOT NULL,
  option_2_datetime timestamptz NOT NULL,
  option_3_datetime timestamptz NOT NULL,
  selected_option int CHECK (selected_option IN (1, 2, 3)),
  selected_at timestamptz,
  decline_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plan_polls_user_idx ON public.plan_polls (user_id);
CREATE INDEX IF NOT EXISTS plan_polls_friend_idx ON public.plan_polls (friend_id);
CREATE INDEX IF NOT EXISTS plan_polls_poll_token_idx ON public.plan_polls (poll_token);

ALTER TABLE public.plan_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY plan_polls_select_own ON public.plan_polls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY plan_polls_insert_own ON public.plan_polls
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY plan_polls_update_own ON public.plan_polls
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY plan_polls_delete_own ON public.plan_polls
  FOR DELETE USING (auth.uid() = user_id);
