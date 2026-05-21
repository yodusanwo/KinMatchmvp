ALTER TABLE public.rituals
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS frequency text,
  ADD COLUMN IF NOT EXISTS next_date date,
  ADD COLUMN IF NOT EXISTS recurrence_pattern text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

UPDATE public.rituals r
SET
  user_id = COALESCE(r.user_id, f.user_id),
  name = COALESCE(r.name, r.label),
  frequency = COALESCE(r.frequency, r.cadence)
FROM public.friends f
WHERE r.friend_id = f.id;

UPDATE public.rituals
SET
  name = COALESCE(name, label, 'Untitled ritual'),
  frequency = COALESCE(frequency, cadence, 'monthly');

ALTER TABLE public.rituals
  ALTER COLUMN friend_id DROP NOT NULL,
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN frequency SET NOT NULL;

ALTER TABLE public.rituals
  DROP CONSTRAINT IF EXISTS rituals_cadence_check,
  DROP CONSTRAINT IF EXISTS rituals_frequency_check,
  DROP CONSTRAINT IF EXISTS rituals_status_check;

ALTER TABLE public.rituals
  ADD CONSTRAINT rituals_cadence_check
  CHECK (cadence IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  ADD CONSTRAINT rituals_frequency_check
  CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  ADD CONSTRAINT rituals_status_check
  CHECK (status IN ('active', 'paused', 'archived'));

CREATE TABLE IF NOT EXISTS public.ritual_participants (
  ritual_id uuid NOT NULL REFERENCES public.rituals(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,
  PRIMARY KEY (ritual_id, friend_id)
);

INSERT INTO public.ritual_participants (ritual_id, friend_id)
SELECT id, friend_id
FROM public.rituals
WHERE friend_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ritual_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_id uuid NOT NULL REFERENCES public.rituals(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  status text DEFAULT 'upcoming',
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ritual_occurrences_status_check
    CHECK (status IN ('upcoming', 'completed', 'missed'))
);

CREATE INDEX IF NOT EXISTS rituals_user_idx
  ON public.rituals(user_id, archived_at)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS ritual_occurrences_date_idx
  ON public.ritual_occurrences(ritual_id, scheduled_date);

ALTER TABLE public.ritual_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ritual_occurrences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rituals_select_own ON public.rituals;
DROP POLICY IF EXISTS rituals_insert_own ON public.rituals;
DROP POLICY IF EXISTS rituals_update_own ON public.rituals;
DROP POLICY IF EXISTS rituals_delete_own ON public.rituals;

CREATE POLICY rituals_select_own ON public.rituals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY rituals_insert_own ON public.rituals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY rituals_update_own ON public.rituals
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY rituals_delete_own ON public.rituals
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS ritual_participants_select_own ON public.ritual_participants;
DROP POLICY IF EXISTS ritual_participants_insert_own ON public.ritual_participants;
DROP POLICY IF EXISTS ritual_participants_update_own ON public.ritual_participants;
DROP POLICY IF EXISTS ritual_participants_delete_own ON public.ritual_participants;

CREATE POLICY ritual_participants_select_own ON public.ritual_participants
  FOR SELECT USING (
    ritual_id IN (SELECT id FROM public.rituals WHERE user_id = auth.uid())
  );

CREATE POLICY ritual_participants_insert_own ON public.ritual_participants
  FOR INSERT WITH CHECK (
    ritual_id IN (SELECT id FROM public.rituals WHERE user_id = auth.uid())
    AND friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY ritual_participants_update_own ON public.ritual_participants
  FOR UPDATE USING (
    ritual_id IN (SELECT id FROM public.rituals WHERE user_id = auth.uid())
  ) WITH CHECK (
    ritual_id IN (SELECT id FROM public.rituals WHERE user_id = auth.uid())
    AND friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY ritual_participants_delete_own ON public.ritual_participants
  FOR DELETE USING (
    ritual_id IN (SELECT id FROM public.rituals WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS ritual_occurrences_select_own ON public.ritual_occurrences;
DROP POLICY IF EXISTS ritual_occurrences_insert_own ON public.ritual_occurrences;
DROP POLICY IF EXISTS ritual_occurrences_update_own ON public.ritual_occurrences;
DROP POLICY IF EXISTS ritual_occurrences_delete_own ON public.ritual_occurrences;

CREATE POLICY ritual_occurrences_select_own ON public.ritual_occurrences
  FOR SELECT USING (
    ritual_id IN (SELECT id FROM public.rituals WHERE user_id = auth.uid())
  );

CREATE POLICY ritual_occurrences_insert_own ON public.ritual_occurrences
  FOR INSERT WITH CHECK (
    ritual_id IN (SELECT id FROM public.rituals WHERE user_id = auth.uid())
  );

CREATE POLICY ritual_occurrences_update_own ON public.ritual_occurrences
  FOR UPDATE USING (
    ritual_id IN (SELECT id FROM public.rituals WHERE user_id = auth.uid())
  ) WITH CHECK (
    ritual_id IN (SELECT id FROM public.rituals WHERE user_id = auth.uid())
  );

CREATE POLICY ritual_occurrences_delete_own ON public.ritual_occurrences
  FOR DELETE USING (
    ritual_id IN (SELECT id FROM public.rituals WHERE user_id = auth.uid())
  );
