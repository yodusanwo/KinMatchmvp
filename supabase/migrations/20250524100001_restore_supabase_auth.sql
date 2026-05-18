-- Restore Supabase Auth (magic link) RLS after Clerk experiment.
-- Drop Clerk-era policies first (they depend on requesting_user_id()).

DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS friends_select_own ON public.friends;
DROP POLICY IF EXISTS friends_insert_own ON public.friends;
DROP POLICY IF EXISTS friends_update_own ON public.friends;
DROP POLICY IF EXISTS friends_delete_own ON public.friends;
DROP POLICY IF EXISTS memory_notes_select_own ON public.memory_notes;
DROP POLICY IF EXISTS memory_notes_insert_own ON public.memory_notes;
DROP POLICY IF EXISTS memory_notes_update_own ON public.memory_notes;
DROP POLICY IF EXISTS memory_notes_delete_own ON public.memory_notes;
DROP POLICY IF EXISTS voice_notes_select_participant ON public.voice_notes;
DROP POLICY IF EXISTS voice_notes_insert_sender ON public.voice_notes;
DROP POLICY IF EXISTS voice_notes_update_participant ON public.voice_notes;
DROP POLICY IF EXISTS voice_notes_delete_sender ON public.voice_notes;
DROP POLICY IF EXISTS shared_interests_select_own ON public.shared_interests;
DROP POLICY IF EXISTS shared_interests_insert_own ON public.shared_interests;
DROP POLICY IF EXISTS shared_interests_update_own ON public.shared_interests;
DROP POLICY IF EXISTS shared_interests_delete_own ON public.shared_interests;
DROP POLICY IF EXISTS rituals_select_own ON public.rituals;
DROP POLICY IF EXISTS rituals_insert_own ON public.rituals;
DROP POLICY IF EXISTS rituals_update_own ON public.rituals;
DROP POLICY IF EXISTS rituals_delete_own ON public.rituals;
DROP POLICY IF EXISTS interactions_select_own ON public.interactions;
DROP POLICY IF EXISTS interactions_insert_own ON public.interactions;
DROP POLICY IF EXISTS interactions_update_own ON public.interactions;
DROP POLICY IF EXISTS interactions_delete_own ON public.interactions;
DROP POLICY IF EXISTS held_relationships_select_participant ON public.held_relationships;
DROP POLICY IF EXISTS held_relationships_insert_holder ON public.held_relationships;
DROP POLICY IF EXISTS held_relationships_update_participant ON public.held_relationships;
DROP POLICY IF EXISTS held_relationships_delete_holder ON public.held_relationships;
DROP POLICY IF EXISTS held_events_select_participant ON public.held_events;
DROP POLICY IF EXISTS held_events_insert_participant ON public.held_events;
DROP POLICY IF EXISTS held_events_update_participant ON public.held_events;
DROP POLICY IF EXISTS held_events_delete_participant ON public.held_events;
DROP POLICY IF EXISTS today_spotlights_select_own ON public.today_spotlights;
DROP POLICY IF EXISTS today_spotlights_insert_own ON public.today_spotlights;
DROP POLICY IF EXISTS today_spotlights_update_own ON public.today_spotlights;
DROP POLICY IF EXISTS today_spotlights_delete_own ON public.today_spotlights;
DROP POLICY IF EXISTS reflection_barriers_select_own ON public.reflection_barriers;
DROP POLICY IF EXISTS reflection_barriers_insert_own ON public.reflection_barriers;
DROP POLICY IF EXISTS reflection_barriers_update_own ON public.reflection_barriers;
DROP POLICY IF EXISTS reflection_barriers_delete_own ON public.reflection_barriers;
DROP POLICY IF EXISTS voice_notes_storage_auth_insert ON storage.objects;

DROP FUNCTION IF EXISTS public.requesting_user_id();
DROP FUNCTION IF EXISTS public.requesting_clerk_id();

-- users
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;

CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_insert_own ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- friends
DROP POLICY IF EXISTS friends_select_own ON public.friends;
DROP POLICY IF EXISTS friends_insert_own ON public.friends;
DROP POLICY IF EXISTS friends_update_own ON public.friends;
DROP POLICY IF EXISTS friends_delete_own ON public.friends;

CREATE POLICY friends_select_own ON public.friends
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY friends_insert_own ON public.friends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY friends_update_own ON public.friends
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY friends_delete_own ON public.friends
  FOR DELETE USING (auth.uid() = user_id);

-- memory_notes
DROP POLICY IF EXISTS memory_notes_select_own ON public.memory_notes;
DROP POLICY IF EXISTS memory_notes_insert_own ON public.memory_notes;
DROP POLICY IF EXISTS memory_notes_update_own ON public.memory_notes;
DROP POLICY IF EXISTS memory_notes_delete_own ON public.memory_notes;

CREATE POLICY memory_notes_select_own ON public.memory_notes
  FOR SELECT USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY memory_notes_insert_own ON public.memory_notes
  FOR INSERT WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY memory_notes_update_own ON public.memory_notes
  FOR UPDATE
  USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  )
  WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY memory_notes_delete_own ON public.memory_notes
  FOR DELETE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

-- voice_notes
DROP POLICY IF EXISTS voice_notes_select_participant ON public.voice_notes;
DROP POLICY IF EXISTS voice_notes_insert_sender ON public.voice_notes;
DROP POLICY IF EXISTS voice_notes_update_participant ON public.voice_notes;
DROP POLICY IF EXISTS voice_notes_delete_sender ON public.voice_notes;

CREATE POLICY voice_notes_select_participant ON public.voice_notes
  FOR SELECT USING (
    sender_user_id = auth.uid()
    OR recipient_user_id = auth.uid()
  );

CREATE POLICY voice_notes_insert_sender ON public.voice_notes
  FOR INSERT WITH CHECK (sender_user_id = auth.uid());

CREATE POLICY voice_notes_update_participant ON public.voice_notes
  FOR UPDATE
  USING (
    sender_user_id = auth.uid()
    OR recipient_user_id = auth.uid()
  )
  WITH CHECK (
    sender_user_id = auth.uid()
    OR recipient_user_id = auth.uid()
  );

CREATE POLICY voice_notes_delete_sender ON public.voice_notes
  FOR DELETE USING (sender_user_id = auth.uid());

-- shared_interests
DROP POLICY IF EXISTS shared_interests_select_own ON public.shared_interests;
DROP POLICY IF EXISTS shared_interests_insert_own ON public.shared_interests;
DROP POLICY IF EXISTS shared_interests_update_own ON public.shared_interests;
DROP POLICY IF EXISTS shared_interests_delete_own ON public.shared_interests;

CREATE POLICY shared_interests_select_own ON public.shared_interests
  FOR SELECT USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY shared_interests_insert_own ON public.shared_interests
  FOR INSERT WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY shared_interests_update_own ON public.shared_interests
  FOR UPDATE
  USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  )
  WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY shared_interests_delete_own ON public.shared_interests
  FOR DELETE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

-- rituals
DROP POLICY IF EXISTS rituals_select_own ON public.rituals;
DROP POLICY IF EXISTS rituals_insert_own ON public.rituals;
DROP POLICY IF EXISTS rituals_update_own ON public.rituals;
DROP POLICY IF EXISTS rituals_delete_own ON public.rituals;

CREATE POLICY rituals_select_own ON public.rituals
  FOR SELECT USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY rituals_insert_own ON public.rituals
  FOR INSERT WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY rituals_update_own ON public.rituals
  FOR UPDATE
  USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  )
  WITH CHECK (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

CREATE POLICY rituals_delete_own ON public.rituals
  FOR DELETE USING (
    friend_id IN (SELECT id FROM public.friends WHERE user_id = auth.uid())
  );

-- interactions
DROP POLICY IF EXISTS interactions_select_own ON public.interactions;
DROP POLICY IF EXISTS interactions_insert_own ON public.interactions;
DROP POLICY IF EXISTS interactions_update_own ON public.interactions;
DROP POLICY IF EXISTS interactions_delete_own ON public.interactions;

CREATE POLICY interactions_select_own ON public.interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY interactions_insert_own ON public.interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY interactions_update_own ON public.interactions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY interactions_delete_own ON public.interactions
  FOR DELETE USING (auth.uid() = user_id);

-- held_relationships
DROP POLICY IF EXISTS held_relationships_select_participant ON public.held_relationships;
DROP POLICY IF EXISTS held_relationships_insert_holder ON public.held_relationships;
DROP POLICY IF EXISTS held_relationships_update_participant ON public.held_relationships;
DROP POLICY IF EXISTS held_relationships_delete_holder ON public.held_relationships;

CREATE POLICY held_relationships_select_participant ON public.held_relationships
  FOR SELECT USING (
    holder_user_id = auth.uid()
    OR held_user_id = auth.uid()
  );

CREATE POLICY held_relationships_insert_holder ON public.held_relationships
  FOR INSERT WITH CHECK (holder_user_id = auth.uid());

CREATE POLICY held_relationships_update_participant ON public.held_relationships
  FOR UPDATE
  USING (
    holder_user_id = auth.uid()
    OR held_user_id = auth.uid()
  )
  WITH CHECK (
    holder_user_id = auth.uid()
    OR held_user_id = auth.uid()
  );

CREATE POLICY held_relationships_delete_holder ON public.held_relationships
  FOR DELETE USING (holder_user_id = auth.uid());

-- held_events
DROP POLICY IF EXISTS held_events_select_participant ON public.held_events;
DROP POLICY IF EXISTS held_events_insert_participant ON public.held_events;
DROP POLICY IF EXISTS held_events_update_participant ON public.held_events;
DROP POLICY IF EXISTS held_events_delete_participant ON public.held_events;

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
  FOR UPDATE
  USING (
    held_relationship_id IN (
      SELECT id FROM public.held_relationships
      WHERE holder_user_id = auth.uid()
         OR held_user_id = auth.uid()
    )
  )
  WITH CHECK (
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
DROP POLICY IF EXISTS today_spotlights_select_own ON public.today_spotlights;
DROP POLICY IF EXISTS today_spotlights_insert_own ON public.today_spotlights;
DROP POLICY IF EXISTS today_spotlights_update_own ON public.today_spotlights;
DROP POLICY IF EXISTS today_spotlights_delete_own ON public.today_spotlights;

CREATE POLICY today_spotlights_select_own ON public.today_spotlights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY today_spotlights_insert_own ON public.today_spotlights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY today_spotlights_update_own ON public.today_spotlights
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY today_spotlights_delete_own ON public.today_spotlights
  FOR DELETE USING (auth.uid() = user_id);

-- reflection_barriers
DROP POLICY IF EXISTS reflection_barriers_select_own ON public.reflection_barriers;
DROP POLICY IF EXISTS reflection_barriers_insert_own ON public.reflection_barriers;
DROP POLICY IF EXISTS reflection_barriers_update_own ON public.reflection_barriers;
DROP POLICY IF EXISTS reflection_barriers_delete_own ON public.reflection_barriers;

CREATE POLICY reflection_barriers_select_own ON public.reflection_barriers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY reflection_barriers_insert_own ON public.reflection_barriers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY reflection_barriers_update_own ON public.reflection_barriers
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY reflection_barriers_delete_own ON public.reflection_barriers
  FOR DELETE USING (auth.uid() = user_id);

-- storage
DROP POLICY IF EXISTS voice_notes_storage_auth_insert ON storage.objects;

CREATE POLICY voice_notes_storage_auth_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Auto-create public.users on Supabase Auth signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
