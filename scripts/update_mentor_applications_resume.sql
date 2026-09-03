-- Migration: require a resume and a location on mentor applications.
-- Run this in the Supabase SQL editor after create_mentor_applications.sql.
--
-- Safe to run on a table that already has rows: the new rules are added as
-- NOT VALID constraints, which Postgres enforces on every insert and update
-- from now on without rejecting applications submitted before this ran.

ALTER TABLE public.mentor_applications
  ADD COLUMN IF NOT EXISTS resume_path text;

-- Resumes live in a PRIVATE bucket, so this stores the object path rather than
-- a public URL. Reviewers open it from the Supabase dashboard, or through a
-- signed URL once the admin screen exists.
COMMENT ON COLUMN public.mentor_applications.resume_path IS
  'Object path inside the private mentor-resumes bucket, e.g. <user id>/resume-<ts>.pdf';

ALTER TABLE public.mentor_applications
  DROP CONSTRAINT IF EXISTS mentor_applications_resume_required;
ALTER TABLE public.mentor_applications
  ADD CONSTRAINT mentor_applications_resume_required
  CHECK (resume_path IS NOT NULL AND char_length(btrim(resume_path)) > 0) NOT VALID;

ALTER TABLE public.mentor_applications
  DROP CONSTRAINT IF EXISTS mentor_applications_location_required;
ALTER TABLE public.mentor_applications
  ADD CONSTRAINT mentor_applications_location_required
  CHECK (location IS NOT NULL AND char_length(btrim(location)) >= 2) NOT VALID;

-- ── Private bucket for resumes ─────────────────────────────────────────────
-- Deliberately NOT public: a CV is personal data and the file name would
-- otherwise be guessable by anyone.
INSERT INTO storage.buckets (id, name, public)
VALUES ('mentor-resumes', 'mentor-resumes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Files are stored as `<user id>/resume-<timestamp>.pdf`, so the first path
-- segment is the owner.
DROP POLICY IF EXISTS "Applicants upload their own resume" ON storage.objects;
CREATE POLICY "Applicants upload their own resume"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'mentor-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Applicants replace their own resume" ON storage.objects;
CREATE POLICY "Applicants replace their own resume"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'mentor-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Applicants read their own resume" ON storage.objects;
CREATE POLICY "Applicants read their own resume"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'mentor-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
