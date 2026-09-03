-- Migration: applications from people who want to become mentors.
-- Run this in the Supabase SQL editor.
--
-- The mentorship hub calls its mentors "certified" and "vetted", but there was
-- no way to apply. This stores applications; the admin review screen comes
-- later. Approval is deliberately NOT automatic — nothing here sets
-- profiles.is_mentor, which stays the marker of an approved mentor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.mentor_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- One application per person. Re-applying updates this row.
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,

  -- Identity and contact. There is no messaging yet, so an email is the only
  -- way an admin can actually follow up.
  full_name text NOT NULL CHECK (char_length(btrim(full_name)) >= 2),
  contact_email text NOT NULL CHECK (position('@' in contact_email) > 1),

  -- Professional standing — the substance of the vetting decision.
  -- Named job_title rather than current_role: CURRENT_ROLE is reserved in SQL.
  job_title text NOT NULL CHECK (char_length(btrim(job_title)) >= 2),
  organisation text,
  years_experience integer NOT NULL CHECK (years_experience BETWEEN 0 AND 60),
  location text,

  -- At least one verifiable link is required by the form; keeping both
  -- nullable here lets an applicant supply either one.
  linkedin_url text,
  portfolio_url text,

  -- What they are offering, matching the hub's six categories.
  categories text[] NOT NULL CHECK (array_length(categories, 1) >= 1),
  expertise text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  availability text NOT NULL,

  -- Enforced at the database level as well as in the UI, like mentor_requests.
  motivation text NOT NULL CHECK (char_length(btrim(motivation)) >= 80),

  agreed_to_guidelines boolean NOT NULL DEFAULT false CHECK (agreed_to_guidelines),

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  -- Filled in by whoever reviews it, once that screen exists.
  reviewer_notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_applications_status
  ON public.mentor_applications (status, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mentor_applications_set_updated_at ON public.mentor_applications;
CREATE TRIGGER mentor_applications_set_updated_at
  BEFORE UPDATE ON public.mentor_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;

-- Applicants see and manage only their own application. No admin policy yet:
-- until there is a role to grant it to, review happens in the Supabase
-- dashboard, which bypasses RLS as the service role.
DROP POLICY IF EXISTS "Applicants read their own application" ON public.mentor_applications;
CREATE POLICY "Applicants read their own application"
  ON public.mentor_applications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Applicants create their own application" ON public.mentor_applications;
CREATE POLICY "Applicants create their own application"
  ON public.mentor_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Applicants update their own application" ON public.mentor_applications;
CREATE POLICY "Applicants update their own application"
  ON public.mentor_applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
