ALTER TABLE public.voice_notes
  ADD COLUMN IF NOT EXISTS discovery_prompt_id uuid REFERENCES public.discovery_prompts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS capture_deferred_until timestamptz,
  ADD COLUMN IF NOT EXISTS capture_defer_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capture_abandoned boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.capture_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_note_id uuid REFERENCES public.voice_notes(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  raw_recap text NOT NULL,
  extracted_items jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS capture_drafts_voice_note_idx
  ON public.capture_drafts(voice_note_id);

ALTER TABLE public.capture_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS capture_drafts_select_own ON public.capture_drafts;
DROP POLICY IF EXISTS capture_drafts_insert_own ON public.capture_drafts;
DROP POLICY IF EXISTS capture_drafts_update_own ON public.capture_drafts;
DROP POLICY IF EXISTS capture_drafts_delete_own ON public.capture_drafts;

CREATE POLICY capture_drafts_select_own ON public.capture_drafts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY capture_drafts_insert_own ON public.capture_drafts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY capture_drafts_update_own ON public.capture_drafts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY capture_drafts_delete_own ON public.capture_drafts
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.memory_notes
  ADD COLUMN IF NOT EXISTS voice_note_id uuid REFERENCES public.voice_notes(id) ON DELETE SET NULL;

ALTER TABLE public.memory_notes DROP CONSTRAINT IF EXISTS memory_notes_source_check;

ALTER TABLE public.memory_notes
  ADD CONSTRAINT memory_notes_source_check
  CHECK (source IN ('manual', 'voice_extraction', 'paste_extraction', 'add_connection', 'voice_capture'));
