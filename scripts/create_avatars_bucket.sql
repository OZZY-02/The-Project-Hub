-- Migration: public `avatars` storage bucket for profile photos.
-- Run this in the Supabase SQL editor.
--
-- Profile photos were previously base64-encoded into profiles.avatar_data_url,
-- which meant every query selecting that column pulled the whole image down.
-- The app now uploads to this bucket and stores the public URL in
-- profiles.avatar_url, falling back to the old column only if the upload fails.

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Files are stored as `<user id>/avatar-<timestamp>.<ext>`, so the first path
-- segment is the owner.
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload their own avatar" ON storage.objects;
CREATE POLICY "Users upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users replace their own avatar" ON storage.objects;
CREATE POLICY "Users replace their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete their own avatar" ON storage.objects;
CREATE POLICY "Users delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
