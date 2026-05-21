ALTER TABLE public.voice_notes
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS friend_id uuid REFERENCES public.friends(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS transcript_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS listen_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capture_pending boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS captured_at timestamptz;

UPDATE public.voice_notes
SET
  sender_id = COALESCE(sender_id, sender_user_id),
  friend_id = COALESCE(friend_id, recipient_friend_id),
  transcript_status = COALESCE(transcript_status, 'pending'),
  listen_count = COALESCE(listen_count, 0),
  capture_pending = COALESCE(capture_pending, true);

ALTER TABLE public.voice_notes
  DROP CONSTRAINT IF EXISTS voice_notes_transcript_status_check;

ALTER TABLE public.voice_notes
  ADD CONSTRAINT voice_notes_transcript_status_check
  CHECK (transcript_status IN ('pending', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS voice_notes_sender_idx
  ON public.voice_notes(sender_id);

CREATE INDEX IF NOT EXISTS voice_notes_friend_idx
  ON public.voice_notes(friend_id);

CREATE INDEX IF NOT EXISTS voice_notes_capture_pending_idx
  ON public.voice_notes(sender_id, capture_pending)
  WHERE capture_pending = true;
