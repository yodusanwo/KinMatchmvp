ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS discovery_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS discovery_completed_at timestamptz;

UPDATE public.users
SET discovery_started_at = onboarding_completed_at
WHERE discovery_started_at IS NULL
  AND onboarding_completed_at IS NOT NULL;

ALTER TABLE public.discovery_prompts
  ADD COLUMN IF NOT EXISTS prompt_cycle int;

UPDATE public.discovery_prompts
SET prompt_cycle = CEIL(COALESCE(prompt_day, 1)::numeric / 2)::int
WHERE prompt_cycle IS NULL;

ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS capture_skip_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capture_archived_at timestamptz;

CREATE INDEX IF NOT EXISTS interactions_capture_queue_idx
  ON public.interactions(user_id, capture_prompt_due_at, occurred_at)
  WHERE type = 'voice_note_sent'
    AND captured_at IS NULL
    AND capture_archived_at IS NULL;
