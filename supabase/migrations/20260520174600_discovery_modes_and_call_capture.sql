ALTER TABLE public.friends
  ADD COLUMN IF NOT EXISTS phone_number text;

-- Interactions are the app's touchpoint store.
ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS mode text
  CHECK (mode IN ('voice_note', 'text', 'call', 'plan', 'in_person'));

ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS capture_prompt_due_at timestamptz;

ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS capture_prompt_dismissed_at timestamptz;

ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS captured_at timestamptz;

UPDATE public.interactions
SET mode = CASE
  WHEN type = 'voice_note_sent' THEN 'voice_note'
  WHEN type = 'voice_note_received' THEN 'voice_note'
  WHEN type = 'call' THEN 'call'
  WHEN type = 'text' THEN 'text'
  WHEN type = 'in_person' THEN 'in_person'
  ELSE mode
END
WHERE mode IS NULL;

-- Discovery prompt log for outreach mode and later memory extraction flows.
CREATE TABLE IF NOT EXISTS public.discovery_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  friend_id uuid REFERENCES public.friends(id) ON DELETE CASCADE NOT NULL,
  interaction_id uuid REFERENCES public.interactions(id) ON DELETE SET NULL,
  memory_note_id uuid REFERENCES public.memory_notes(id) ON DELETE SET NULL,
  prompt_day int,
  question text,
  category text,
  outreach_mode text CHECK (outreach_mode IN ('voice_note', 'text')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discovery_prompts
  ADD COLUMN IF NOT EXISTS outreach_mode text CHECK (outreach_mode IN ('voice_note', 'text'));

CREATE INDEX IF NOT EXISTS discovery_prompts_user_idx
  ON public.discovery_prompts(user_id);

CREATE INDEX IF NOT EXISTS discovery_prompts_friend_idx
  ON public.discovery_prompts(friend_id);

CREATE INDEX IF NOT EXISTS discovery_prompts_interaction_idx
  ON public.discovery_prompts(interaction_id);

ALTER TABLE public.discovery_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS discovery_prompts_select_own ON public.discovery_prompts;
DROP POLICY IF EXISTS discovery_prompts_insert_own ON public.discovery_prompts;
DROP POLICY IF EXISTS discovery_prompts_update_own ON public.discovery_prompts;

CREATE POLICY discovery_prompts_select_own ON public.discovery_prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY discovery_prompts_insert_own ON public.discovery_prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY discovery_prompts_update_own ON public.discovery_prompts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
