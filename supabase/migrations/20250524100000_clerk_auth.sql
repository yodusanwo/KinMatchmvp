-- Clerk third-party auth: map Clerk user IDs to public.users and update RLS.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS clerk_id text UNIQUE;

ALTER TABLE public.users
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.requesting_clerk_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(auth.jwt()->>'sub', '');
$$;

CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.users
  WHERE clerk_id = public.requesting_clerk_id()
  LIMIT 1;
$$;

-- users
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (clerk_id = public.requesting_clerk_id());

CREATE POLICY users_insert_own ON public.users
  FOR INSERT WITH CHECK (clerk_id = public.requesting_clerk_id());

CREATE POLICY users_update_own ON public.users
  FOR UPDATE
  USING (clerk_id = public.requesting_clerk_id())
  WITH CHECK (clerk_id = public.requesting_clerk_id());

-- friends
DROP POLICY IF EXISTS friends_select_own ON public.friends;
DROP POLICY IF EXISTS friends_insert_own ON public.friends;
DROP POLICY IF EXISTS friends_update_own ON public.friends;
DROP POLICY IF EXISTS friends_delete_own ON public.friends;

CREATE POLICY friends_select_own ON public.friends
  FOR SELECT USING (user_id = public.requesting_user_id());

CREATE POLICY friends_insert_own ON public.friends
  FOR INSERT WITH CHECK (user_id = public.requesting_user_id());

CREATE POLICY friends_update_own ON public.friends
  FOR UPDATE
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

CREATE POLICY friends_delete_own ON public.friends
  FOR DELETE USING (user_id = public.requesting_user_id());

-- memory_notes
DROP POLICY IF EXISTS memory_notes_select_own ON public.memory_notes;
DROP POLICY IF EXISTS memory_notes_insert_own ON public.memory_notes;
DROP POLICY IF EXISTS memory_notes_update_own ON public.memory_notes;
DROP POLICY IF EXISTS memory_notes_delete_own ON public.memory_notes;

CREATE POLICY memory_notes_select_own ON public.memory_notes
  FOR SELECT USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY memory_notes_insert_own ON public.memory_notes
  FOR INSERT WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY memory_notes_update_own ON public.memory_notes
  FOR UPDATE
  USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  )
  WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY memory_notes_delete_own ON public.memory_notes
  FOR DELETE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

-- voice_notes
DROP POLICY IF EXISTS voice_notes_select_participant ON public.voice_notes;
DROP POLICY IF EXISTS voice_notes_insert_sender ON public.voice_notes;
DROP POLICY IF EXISTS voice_notes_update_participant ON public.voice_notes;
DROP POLICY IF EXISTS voice_notes_delete_sender ON public.voice_notes;

CREATE POLICY voice_notes_select_participant ON public.voice_notes
  FOR SELECT USING (
    sender_user_id = public.requesting_user_id()
    OR recipient_user_id = public.requesting_user_id()
  );

CREATE POLICY voice_notes_insert_sender ON public.voice_notes
  FOR INSERT WITH CHECK (sender_user_id = public.requesting_user_id());

CREATE POLICY voice_notes_update_participant ON public.voice_notes
  FOR UPDATE
  USING (
    sender_user_id = public.requesting_user_id()
    OR recipient_user_id = public.requesting_user_id()
  )
  WITH CHECK (
    sender_user_id = public.requesting_user_id()
    OR recipient_user_id = public.requesting_user_id()
  );

CREATE POLICY voice_notes_delete_sender ON public.voice_notes
  FOR DELETE USING (sender_user_id = public.requesting_user_id());

-- shared_interests, rituals, interactions (same friend-scoped pattern)
DROP POLICY IF EXISTS shared_interests_select_own ON public.shared_interests;
DROP POLICY IF EXISTS shared_interests_insert_own ON public.shared_interests;
DROP POLICY IF EXISTS shared_interests_update_own ON public.shared_interests;
DROP POLICY IF EXISTS shared_interests_delete_own ON public.shared_interests;

CREATE POLICY shared_interests_select_own ON public.shared_interests
  FOR SELECT USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY shared_interests_insert_own ON public.shared_interests
  FOR INSERT WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY shared_interests_update_own ON public.shared_interests
  FOR UPDATE
  USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  )
  WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY shared_interests_delete_own ON public.shared_interests
  FOR DELETE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

DROP POLICY IF EXISTS rituals_select_own ON public.rituals;
DROP POLICY IF EXISTS rituals_insert_own ON public.rituals;
DROP POLICY IF EXISTS rituals_update_own ON public.rituals;
DROP POLICY IF EXISTS rituals_delete_own ON public.rituals;

CREATE POLICY rituals_select_own ON public.rituals
  FOR SELECT USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY rituals_insert_own ON public.rituals
  FOR INSERT WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY rituals_update_own ON public.rituals
  FOR UPDATE
  USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  )
  WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY rituals_delete_own ON public.rituals
  FOR DELETE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

DROP POLICY IF EXISTS interactions_select_own ON public.interactions;
DROP POLICY IF EXISTS interactions_insert_own ON public.interactions;
DROP POLICY IF EXISTS interactions_update_own ON public.interactions;
DROP POLICY IF EXISTS interactions_delete_own ON public.interactions;

CREATE POLICY interactions_select_own ON public.interactions
  FOR SELECT USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY interactions_insert_own ON public.interactions
  FOR INSERT WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY interactions_update_own ON public.interactions
  FOR UPDATE
  USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  )
  WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

CREATE POLICY interactions_delete_own ON public.interactions
  FOR DELETE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = public.requesting_user_id())
  );

-- held_relationships
DROP POLICY IF EXISTS held_relationships_select_participant ON public.held_relationships;
DROP POLICY IF EXISTS held_relationships_insert_holder ON public.held_relationships;
DROP POLICY IF EXISTS held_relationships_update_participant ON public.held_relationships;
DROP POLICY IF EXISTS held_relationships_delete_holder ON public.held_relationships;

CREATE POLICY held_relationships_select_participant ON public.held_relationships
  FOR SELECT USING (
    holder_user_id = public.requesting_user_id()
    OR held_user_id = public.requesting_user_id()
  );

CREATE POLICY held_relationships_insert_holder ON public.held_relationships
  FOR INSERT WITH CHECK (holder_user_id = public.requesting_user_id());

CREATE POLICY held_relationships_update_participant ON public.held_relationships
  FOR UPDATE
  USING (
    holder_user_id = public.requesting_user_id()
    OR held_user_id = public.requesting_user_id()
  )
  WITH CHECK (
    holder_user_id = public.requesting_user_id()
    OR held_user_id = public.requesting_user_id()
  );

CREATE POLICY held_relationships_delete_holder ON public.held_relationships
  FOR DELETE USING (holder_user_id = public.requesting_user_id());

-- held_events
DROP POLICY IF EXISTS held_events_select_participant ON public.held_events;
DROP POLICY IF EXISTS held_events_insert_participant ON public.held_events;
DROP POLICY IF EXISTS held_events_update_participant ON public.held_events;
DROP POLICY IF EXISTS held_events_delete_participant ON public.held_events;

CREATE POLICY held_events_select_participant ON public.held_events
  FOR SELECT USING (
    held_relationship_id IN (
      SELECT id FROM public.held_relationships
      WHERE holder_user_id = public.requesting_user_id()
         OR held_user_id = public.requesting_user_id()
    )
  );

CREATE POLICY held_events_insert_participant ON public.held_events
  FOR INSERT WITH CHECK (
    held_relationship_id IN (
      SELECT id FROM public.held_relationships
      WHERE holder_user_id = public.requesting_user_id()
         OR held_user_id = public.requesting_user_id()
    )
  );

CREATE POLICY held_events_update_participant ON public.held_events
  FOR UPDATE
  USING (
    held_relationship_id IN (
      SELECT id FROM public.held_relationships
      WHERE holder_user_id = public.requesting_user_id()
         OR held_user_id = public.requesting_user_id()
    )
  )
  WITH CHECK (
    held_relationship_id IN (
      SELECT id FROM public.held_relationships
      WHERE holder_user_id = public.requesting_user_id()
         OR held_user_id = public.requesting_user_id()
    )
  );

CREATE POLICY held_events_delete_participant ON public.held_events
  FOR DELETE USING (
    held_relationship_id IN (
      SELECT id FROM public.held_relationships
      WHERE holder_user_id = public.requesting_user_id()
         OR held_user_id = public.requesting_user_id()
    )
  );

-- today_spotlights, reflection_barriers
DROP POLICY IF EXISTS today_spotlights_select_own ON public.today_spotlights;
DROP POLICY IF EXISTS today_spotlights_insert_own ON public.today_spotlights;
DROP POLICY IF EXISTS today_spotlights_update_own ON public.today_spotlights;
DROP POLICY IF EXISTS today_spotlights_delete_own ON public.today_spotlights;

CREATE POLICY today_spotlights_select_own ON public.today_spotlights
  FOR SELECT USING (user_id = public.requesting_user_id());

CREATE POLICY today_spotlights_insert_own ON public.today_spotlights
  FOR INSERT WITH CHECK (user_id = public.requesting_user_id());

CREATE POLICY today_spotlights_update_own ON public.today_spotlights
  FOR UPDATE
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

CREATE POLICY today_spotlights_delete_own ON public.today_spotlights
  FOR DELETE USING (user_id = public.requesting_user_id());

DROP POLICY IF EXISTS reflection_barriers_select_own ON public.reflection_barriers;
DROP POLICY IF EXISTS reflection_barriers_insert_own ON public.reflection_barriers;
DROP POLICY IF EXISTS reflection_barriers_update_own ON public.reflection_barriers;
DROP POLICY IF EXISTS reflection_barriers_delete_own ON public.reflection_barriers;

CREATE POLICY reflection_barriers_select_own ON public.reflection_barriers
  FOR SELECT USING (user_id = public.requesting_user_id());

CREATE POLICY reflection_barriers_insert_own ON public.reflection_barriers
  FOR INSERT WITH CHECK (user_id = public.requesting_user_id());

CREATE POLICY reflection_barriers_update_own ON public.reflection_barriers
  FOR UPDATE
  USING (user_id = public.requesting_user_id())
  WITH CHECK (user_id = public.requesting_user_id());

CREATE POLICY reflection_barriers_delete_own ON public.reflection_barriers
  FOR DELETE USING (user_id = public.requesting_user_id());

-- storage: voice note uploads
DROP POLICY IF EXISTS voice_notes_storage_auth_insert ON storage.objects;

CREATE POLICY voice_notes_storage_auth_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = public.requesting_user_id()::text
  );
