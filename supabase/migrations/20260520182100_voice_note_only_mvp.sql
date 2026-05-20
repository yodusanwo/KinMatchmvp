-- v1.1 features: Text and Call as secondary action pills, Plan poll system.
-- Pilot MVP is voice-note only to validate the core rhythm + memory loop.

ALTER TABLE public.interactions
  DROP CONSTRAINT IF EXISTS interactions_mode_check;

ALTER TABLE public.interactions
  DROP CONSTRAINT IF EXISTS valid_mode;

UPDATE public.interactions
SET mode = 'voice_note'
WHERE mode IN ('text', 'call', 'plan');

UPDATE public.interactions
SET mode = 'voice_note'
WHERE type = 'voice_note_sent' AND mode IS NULL;

ALTER TABLE public.interactions
  ADD CONSTRAINT valid_mode
  CHECK (mode IN ('voice_note', 'response_captured'));

DO $$
BEGIN
  IF to_regclass('public.touchpoints') IS NOT NULL THEN
    ALTER TABLE public.touchpoints DROP CONSTRAINT IF EXISTS valid_mode;

    UPDATE public.touchpoints
    SET mode = 'voice_note_sent'
    WHERE mode IN ('text', 'call', 'plan');

    ALTER TABLE public.touchpoints
      ADD CONSTRAINT valid_mode
      CHECK (mode IN ('voice_note_sent', 'response_captured'));
  END IF;
END $$;
