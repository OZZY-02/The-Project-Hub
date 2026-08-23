-- Migration: session requests sent to mentors from /mentorship.
-- Run this in the Supabase SQL editor.
--
-- "Request Session" previously did nothing at all. It now opens a form that
-- requires the requester to explain what they want help with, which is both
-- more useful to the mentor and the cheapest spam control available.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.mentor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,

  -- Text, not a foreign key: a mentor may be a real profile id or one of the
  -- seeded ids such as "mentor-1" until enough profiles opt in as mentors.
  mentor_id text NOT NULL,
  -- Denormalised so a request stays readable if the mentor profile changes.
  mentor_name text NOT NULL,

  -- The whole point. Enforced at the database level as well as in the UI so a
  -- direct API call cannot bypass it.
  reason text NOT NULL CHECK (char_length(btrim(reason)) >= 40),

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One open request per mentor per person: the real rate limit.
  UNIQUE (requester_id, mentor_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_requests_requester ON public.mentor_requests (requester_id);
CREATE INDEX IF NOT EXISTS idx_mentor_requests_mentor ON public.mentor_requests (mentor_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mentor_requests_set_updated_at ON public.mentor_requests;
CREATE TRIGGER mentor_requests_set_updated_at
  BEFORE UPDATE ON public.mentor_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;

-- Requesters see and create their own requests.
DROP POLICY IF EXISTS "Requesters read their own requests" ON public.mentor_requests;
CREATE POLICY "Requesters read their own requests"
  ON public.mentor_requests FOR SELECT
  USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Requesters create their own requests" ON public.mentor_requests;
CREATE POLICY "Requesters create their own requests"
  ON public.mentor_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Requesters may withdraw; only the mentor should accept or decline.
DROP POLICY IF EXISTS "Requesters withdraw their own requests" ON public.mentor_requests;
CREATE POLICY "Requesters withdraw their own requests"
  ON public.mentor_requests FOR UPDATE
  USING (auth.uid() = requester_id)
  WITH CHECK (auth.uid() = requester_id);

-- Mentors see requests addressed to them (real profile ids only).
DROP POLICY IF EXISTS "Mentors read requests addressed to them" ON public.mentor_requests;
CREATE POLICY "Mentors read requests addressed to them"
  ON public.mentor_requests FOR SELECT
  USING (mentor_id = auth.uid()::text);

DROP POLICY IF EXISTS "Mentors respond to their requests" ON public.mentor_requests;
CREATE POLICY "Mentors respond to their requests"
  ON public.mentor_requests FOR UPDATE
  USING (mentor_id = auth.uid()::text)
  WITH CHECK (mentor_id = auth.uid()::text);
