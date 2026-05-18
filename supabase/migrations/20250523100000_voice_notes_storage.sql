-- Public bucket for voice note audio (pilot). Service role uploads from API routes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-notes',
  'voice-notes',
  true,
  15728640,
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY voice_notes_storage_public_read ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'voice-notes');

CREATE POLICY voice_notes_storage_auth_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'voice-notes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
