-- Migration: create profile_intakes table for storing sample intake submissions
-- Run this in Supabase SQL editor or via psql

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profile_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  data jsonb NOT NULL,
  resume_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_intakes_user_id ON public.profile_intakes (user_id);

-- Note: Configure RLS policies and a Storage bucket named `intakes` in Supabase
-- to allow authenticated users to upload files and insert rows as needed.

-- Example RLS policy to allow authenticated users to insert their own rows:
-- ALTER TABLE public.profile_intakes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow insert for owner" ON public.profile_intakes
--   FOR INSERT USING (auth.role() = 'authenticated') WITH CHECK (auth.uid() = user_id);

-- If you prefer to allow inserts where your client sets user_id, ensure the check matches
-- CREATE POLICY "Allow insert with matching user_id" ON public.profile_intakes
--   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
