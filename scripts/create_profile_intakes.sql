-- Migration: create profile_intakes table for storing sample intake submissions
-- Run this in Supabase SQL editor or via psql

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
