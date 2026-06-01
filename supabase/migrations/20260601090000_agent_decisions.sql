-- Agent Decisions Log
-- Records every decision made by the KinMatch Relational Care Agent.
-- Used for audit trails, debugging, and product analytics.

CREATE TABLE IF NOT EXISTS public.agent_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  decision_type TEXT NOT NULL CHECK (decision_type IN (
    'nudge_sent',
    'ritual_suggested',
    'no_action_needed',
    'no_eligible_friends',
    'frequency_cap_reached',
    'error'
  )),

  reasoning TEXT NOT NULL,
  friend_id UUID REFERENCES public.friends(id) ON DELETE SET NULL,
  message TEXT,
  ritual_name TEXT,
  calendar_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_user_created
  ON public.agent_decisions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_user_type
  ON public.agent_decisions (user_id, decision_type, created_at DESC);

ALTER TABLE public.agent_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_decisions_select_own"
  ON public.agent_decisions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "agent_decisions_insert_own"
  ON public.agent_decisions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.agent_decisions IS
  'Audit log of every decision made by the KinMatch Relational Care Agent. Immutable.';