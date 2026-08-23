-- Migration: create the tables behind /matching.
-- Run this in the Supabase SQL editor.
--
-- Until this ran, both tables were queried by the app but never existed, so
-- every posted project and every saved match lived only in the poster's
-- localStorage — invisible to everyone else and lost when the browser cleared.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Projects posted to the matching hub ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  subtitle text,
  location text,
  tags text[] NOT NULL DEFAULT '{}',
  needed integer NOT NULL DEFAULT 1,
  joined integer NOT NULL DEFAULT 0,
  images text[] NOT NULL DEFAULT '{}',
  -- Full MatchCard as rendered by the client; keeps postTypes and any future
  -- fields without a migration for each one.
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- This table already exists in some environments, created before these
-- migrations, in which case CREATE TABLE above is a no-op. Add anything a
-- pre-existing copy is missing, or the updated_at trigger below fails at
-- runtime on the first edit.
ALTER TABLE public.match_projects
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_match_projects_user_id ON public.match_projects (user_id);
CREATE INDEX IF NOT EXISTS idx_match_projects_created_at ON public.match_projects (created_at DESC);

-- ── Saved matches (makers, mentors, projects) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- Text rather than a foreign key: a saved match may be a profile id, a
  -- match_projects id, or a seeded demo id such as "demo-project-edtech".
  match_id text NOT NULL,
  match_type text NOT NULL CHECK (match_type IN ('maker', 'mentor', 'project')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_match_saves_user_id ON public.match_saves (user_id);

-- ── updated_at maintenance ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS match_projects_set_updated_at ON public.match_projects;
CREATE TRIGGER match_projects_set_updated_at
  BEFORE UPDATE ON public.match_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row level security ─────────────────────────────────────────────────────
-- Projects: anyone may browse, only the owner may write.
ALTER TABLE public.match_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Projects are publicly readable" ON public.match_projects;
CREATE POLICY "Projects are publicly readable"
  ON public.match_projects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owners insert their projects" ON public.match_projects;
CREATE POLICY "Owners insert their projects"
  ON public.match_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners update their projects" ON public.match_projects;
CREATE POLICY "Owners update their projects"
  ON public.match_projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners delete their projects" ON public.match_projects;
CREATE POLICY "Owners delete their projects"
  ON public.match_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Saves: private to the person who made them.
ALTER TABLE public.match_saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Saves are private to their owner" ON public.match_saves;
CREATE POLICY "Saves are private to their owner"
  ON public.match_saves FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Storage bucket for project images ──────────────────────────────────────
-- /matching uploads project photos to a bucket named `match-projects`.
INSERT INTO storage.buckets (id, name, public)
VALUES ('match-projects', 'match-projects', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Project images are publicly readable" ON storage.objects;
CREATE POLICY "Project images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'match-projects');

DROP POLICY IF EXISTS "Owners upload project images" ON storage.objects;
CREATE POLICY "Owners upload project images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'match-projects'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners replace project images" ON storage.objects;
CREATE POLICY "Owners replace project images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'match-projects'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
