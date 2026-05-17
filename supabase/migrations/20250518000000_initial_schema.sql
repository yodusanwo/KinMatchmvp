-- KinMatch initial schema (11 tables)
-- Run via Supabase SQL editor or: supabase db push

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id                        uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email                     text UNIQUE NOT NULL,
  name                      text,
  timezone                  text NOT NULL DEFAULT 'America/Chicago',
  onboarding_completed_at   timestamptz,
  email_preferences         jsonb NOT NULL DEFAULT '{
    "daily_checkin": true,
    "sunday_voice_drop": true,
    "held_alerts": true
  }'::jsonb,
  created_at                timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- friends (Connections in user-facing language)
-- ---------------------------------------------------------------------------
CREATE TABLE public.friends (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  name                text NOT NULL,
  avatar_color        text NOT NULL,
  vibe                text NOT NULL,
  where_met           text,
  met_at              date,
  birthday            date,
  cadence_days        int NOT NULL DEFAULT 14,
  last_touch_at       timestamptz,
  is_wished_closer    boolean NOT NULL DEFAULT false,
  in_tribe            boolean NOT NULL DEFAULT true,
  archived_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friends_avatar_color_check CHECK (
    avatar_color IN ('t', 't2', 'f', 'm', 'g')
  ),
  CONSTRAINT friends_vibe_check CHECK (
    vibe IN ('potential_close', 'activity', 'professional', 'community')
  )
);

CREATE INDEX friends_user_id_idx ON public.friends (user_id);

-- ---------------------------------------------------------------------------
-- memory_notes
-- ---------------------------------------------------------------------------
CREATE TABLE public.memory_notes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id           uuid NOT NULL REFERENCES public.friends (id) ON DELETE CASCADE,
  text                text NOT NULL,
  event_date          date,
  tag                 text NOT NULL,
  source              text NOT NULL,
  last_surfaced_at    timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memory_notes_tag_check CHECK (
    tag IN ('health', 'family', 'work', 'milestone', 'interest', 'other')
  ),
  CONSTRAINT memory_notes_source_check CHECK (
    source IN ('manual', 'voice_extraction', 'add_connection')
  )
);

CREATE INDEX memory_notes_friend_id_idx ON public.memory_notes (friend_id);

-- ---------------------------------------------------------------------------
-- voice_notes
-- ---------------------------------------------------------------------------
CREATE TABLE public.voice_notes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id          uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  recipient_friend_id     uuid REFERENCES public.friends (id) ON DELETE SET NULL,
  recipient_user_id       uuid REFERENCES public.users (id) ON DELETE SET NULL,
  audio_url               text NOT NULL,
  duration_seconds        int NOT NULL,
  waveform_peaks          jsonb NOT NULL,
  transcript              text,
  listened_at             timestamptz,
  share_token             text UNIQUE NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX voice_notes_sender_user_id_idx ON public.voice_notes (sender_user_id);
CREATE INDEX voice_notes_recipient_user_id_idx ON public.voice_notes (recipient_user_id);
CREATE INDEX voice_notes_recipient_friend_id_idx ON public.voice_notes (recipient_friend_id);
CREATE INDEX voice_notes_share_token_idx ON public.voice_notes (share_token);

-- ---------------------------------------------------------------------------
-- shared_interests
-- ---------------------------------------------------------------------------
CREATE TABLE public.shared_interests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id   uuid NOT NULL REFERENCES public.friends (id) ON DELETE CASCADE,
  label       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shared_interests_friend_id_idx ON public.shared_interests (friend_id);

-- ---------------------------------------------------------------------------
-- rituals
-- ---------------------------------------------------------------------------
CREATE TABLE public.rituals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_id           uuid NOT NULL REFERENCES public.friends (id) ON DELETE CASCADE,
  label               text NOT NULL,
  cadence             text NOT NULL,
  streak_count        int NOT NULL DEFAULT 0,
  last_occurred_at    date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rituals_cadence_check CHECK (
    cadence IN ('weekly', 'biweekly', 'monthly')
  )
);

CREATE INDEX rituals_friend_id_idx ON public.rituals (friend_id);

-- ---------------------------------------------------------------------------
-- interactions
-- ---------------------------------------------------------------------------
CREATE TABLE public.interactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  friend_id           uuid NOT NULL REFERENCES public.friends (id) ON DELETE CASCADE,
  type                text NOT NULL,
  voice_note_id       uuid REFERENCES public.voice_notes (id) ON DELETE SET NULL,
  duration_minutes    int,
  location            text,
  notes               text,
  occurred_at         timestamptz NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interactions_type_check CHECK (
    type IN (
      'voice_note_sent',
      'voice_note_received',
      'call',
      'in_person',
      'text'
    )
  )
);

CREATE INDEX interactions_user_id_idx ON public.interactions (user_id);
CREATE INDEX interactions_friend_id_idx ON public.interactions (friend_id);

-- ---------------------------------------------------------------------------
-- held_relationships
-- ---------------------------------------------------------------------------
CREATE TABLE public.held_relationships (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_user_id      uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  held_user_id        uuid REFERENCES public.users (id) ON DELETE CASCADE,
  held_friend_id      uuid REFERENCES public.friends (id) ON DELETE CASCADE,
  threshold_days      int NOT NULL DEFAULT 10,
  status              text NOT NULL DEFAULT 'active',
  last_alert_fired_at timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT held_relationships_status_check CHECK (
    status IN ('active', 'paused')
  ),
  CONSTRAINT held_relationships_target_check CHECK (
    held_user_id IS NOT NULL OR held_friend_id IS NOT NULL
  )
);

CREATE INDEX held_relationships_holder_user_id_idx ON public.held_relationships (holder_user_id);
CREATE INDEX held_relationships_held_user_id_idx ON public.held_relationships (held_user_id);

-- ---------------------------------------------------------------------------
-- held_events
-- ---------------------------------------------------------------------------
CREATE TABLE public.held_events (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  held_relationship_id        uuid NOT NULL REFERENCES public.held_relationships (id) ON DELETE CASCADE,
  event_type                  text NOT NULL,
  response_voice_note_id      uuid REFERENCES public.voice_notes (id) ON DELETE SET NULL,
  occurred_at                 timestamptz NOT NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT held_events_event_type_check CHECK (
    event_type IN ('alert_fired', 'response_received', 'paused', 'threshold_changed')
  )
);

CREATE INDEX held_events_held_relationship_id_idx ON public.held_events (held_relationship_id);

-- ---------------------------------------------------------------------------
-- today_spotlights (daily computed cache)
-- ---------------------------------------------------------------------------
CREATE TABLE public.today_spotlights (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  friend_id           uuid NOT NULL REFERENCES public.friends (id) ON DELETE CASCADE,
  trigger_type        text NOT NULL,
  priority_score      int NOT NULL,
  prompt_text         text NOT NULL,
  suggested_action    text NOT NULL,
  generated_for_date  date NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT today_spotlights_trigger_type_check CHECK (
    trigger_type IN (
      'drift',
      'birthday',
      'memory_event',
      'reciprocity',
      'held',
      'approaching'
    )
  ),
  CONSTRAINT today_spotlights_suggested_action_check CHECK (
    suggested_action IN ('voice_note', 'text', 'call', 'plan')
  ),
  CONSTRAINT today_spotlights_user_date_unique UNIQUE (user_id, generated_for_date)
);

CREATE INDEX today_spotlights_user_id_idx ON public.today_spotlights (user_id);

-- ---------------------------------------------------------------------------
-- reflection_barriers (Q3 onboarding answers)
-- ---------------------------------------------------------------------------
CREATE TABLE public.reflection_barriers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  barrier     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reflection_barriers_barrier_check CHECK (
    barrier IN (
      'i_forget',
      'distance',
      'busy',
      'awkward',
      'unsure_how',
      'one_sided'
    )
  )
);

CREATE INDEX reflection_barriers_user_id_idx ON public.reflection_barriers (user_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.held_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.held_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.today_spotlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_barriers ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_insert_own ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- friends
CREATE POLICY friends_select_own ON public.friends
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY friends_insert_own ON public.friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY friends_update_own ON public.friends
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY friends_delete_own ON public.friends
  FOR DELETE USING (auth.uid() = user_id);

-- memory_notes (via friends)
CREATE POLICY memory_notes_select_own ON public.memory_notes
  FOR SELECT USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY memory_notes_insert_own ON public.memory_notes
  FOR INSERT WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY memory_notes_update_own ON public.memory_notes
  FOR UPDATE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  ) WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY memory_notes_delete_own ON public.memory_notes
  FOR DELETE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

-- voice_notes (sender or recipient; public read by share_token for listening links)
CREATE POLICY voice_notes_select_participant ON public.voice_notes
  FOR SELECT USING (
    sender_user_id = auth.uid()
    OR recipient_user_id = auth.uid()
  );

CREATE POLICY voice_notes_select_public_share ON public.voice_notes
  FOR SELECT TO anon, authenticated
  USING (share_token IS NOT NULL);

CREATE POLICY voice_notes_insert_sender ON public.voice_notes
  FOR INSERT WITH CHECK (sender_user_id = auth.uid());

CREATE POLICY voice_notes_update_participant ON public.voice_notes
  FOR UPDATE USING (
    sender_user_id = auth.uid()
    OR recipient_user_id = auth.uid()
  ) WITH CHECK (
    sender_user_id = auth.uid()
    OR recipient_user_id = auth.uid()
  );

CREATE POLICY voice_notes_delete_sender ON public.voice_notes
  FOR DELETE USING (sender_user_id = auth.uid());

-- shared_interests (via friends)
CREATE POLICY shared_interests_select_own ON public.shared_interests
  FOR SELECT USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY shared_interests_insert_own ON public.shared_interests
  FOR INSERT WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY shared_interests_update_own ON public.shared_interests
  FOR UPDATE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  ) WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY shared_interests_delete_own ON public.shared_interests
  FOR DELETE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

-- rituals (via friends)
CREATE POLICY rituals_select_own ON public.rituals
  FOR SELECT USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY rituals_insert_own ON public.rituals
  FOR INSERT WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY rituals_update_own ON public.rituals
  FOR UPDATE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  ) WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY rituals_delete_own ON public.rituals
  FOR DELETE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

-- interactions
CREATE POLICY interactions_select_own ON public.interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY interactions_insert_own ON public.interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY interactions_update_own ON public.interactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY interactions_delete_own ON public.interactions
  FOR DELETE USING (auth.uid() = user_id);

-- held_relationships (holder or held)
CREATE POLICY held_relationships_select_participant ON public.held_relationships
  FOR SELECT USING (
    holder_user_id = auth.uid()
    OR held_user_id = auth.uid()
  );

CREATE POLICY held_relationships_insert_holder ON public.held_relationships
  FOR INSERT WITH CHECK (holder_user_id = auth.uid());

CREATE POLICY held_relationships_update_participant ON public.held_relationships
  FOR UPDATE USING (
    holder_user_id = auth.uid()
    OR held_user_id = auth.uid()
  ) WITH CHECK (
    holder_user_id = auth.uid()
    OR held_user_id = auth.uid()
  );

CREATE POLICY held_relationships_delete_holder ON public.held_relationships
  FOR DELETE USING (holder_user_id = auth.uid());

-- held_events (via held_relationships)
CREATE POLICY held_events_select_participant ON public.held_events
  FOR SELECT USING (
    held_relationship_id IN (
      SELECT id FROM public.held_relationships
      WHERE holder_user_id = auth.uid()
         OR held_user_id = auth.uid()
    )
  );

CREATE POLICY held_events_insert_participant ON public.held_events
  FOR INSERT WITH CHECK (
    held_relationship_id IN (
      SELECT id FROM public.held_relationships
      WHERE holder_user_id = auth.uid()
         OR held_user_id = auth.uid()
    )
  );

CREATE POLICY held_events_update_participant ON public.held_events
  FOR UPDATE USING (
    held_relationship_id IN (
      SELECT id FROM public.held_relationships
      WHERE holder_user_id = auth.uid()
         OR held_user_id = auth.uid()
    )
  ) WITH CHECK (
    held_relationship_id IN (
      SELECT id FROM public.held_relationships
      WHERE holder_user_id = auth.uid()
         OR held_user_id = auth.uid()
    )
  );

CREATE POLICY held_events_delete_participant ON public.held_events
  FOR DELETE USING (
    held_relationship_id IN (
      SELECT id FROM public.held_relationships
      WHERE holder_user_id = auth.uid()
         OR held_user_id = auth.uid()
    )
  );

-- today_spotlights
CREATE POLICY today_spotlights_select_own ON public.today_spotlights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY today_spotlights_insert_own ON public.today_spotlights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY today_spotlights_update_own ON public.today_spotlights
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY today_spotlights_delete_own ON public.today_spotlights
  FOR DELETE USING (auth.uid() = user_id);

-- reflection_barriers
CREATE POLICY reflection_barriers_select_own ON public.reflection_barriers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY reflection_barriers_insert_own ON public.reflection_barriers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY reflection_barriers_update_own ON public.reflection_barriers
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY reflection_barriers_delete_own ON public.reflection_barriers
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-create public.users row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
