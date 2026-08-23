-- Migration: bring profile_intakes up to what the app actually expects.
-- Run this in the Supabase SQL editor after scripts/create_profile_intakes.sql.
--
-- Two things were missing:
--   1. `updated_at` — /matching and /profile/[id] both order intakes by it.
--   2. a UNIQUE constraint on `user_id` — /profile/create upserts with
--      onConflict: "user_id", which errors without one, so completing the
--      wizard silently saved no skills or projects.

ALTER TABLE public.profile_intakes
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Collapse any duplicate rows per user (keep the most recently touched one)
-- so the unique constraint below can be created.
--
-- THIS DELETES ROWS. To see what it would remove, run this first:
--
--   SELECT user_id, count(*) FROM public.profile_intakes
--   WHERE user_id IS NOT NULL GROUP BY user_id HAVING count(*) > 1;
--
-- If that returns nothing, the delete below is a no-op.
DELETE FROM public.profile_intakes a
USING public.profile_intakes b
WHERE a.user_id IS NOT NULL
  AND a.user_id = b.user_id
  AND (a.updated_at, a.id) < (b.updated_at, b.id);

ALTER TABLE public.profile_intakes
  DROP CONSTRAINT IF EXISTS profile_intakes_user_id_key;

ALTER TABLE public.profile_intakes
  ADD CONSTRAINT profile_intakes_user_id_key UNIQUE (user_id);

-- Keep updated_at current on every write.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_intakes_set_updated_at ON public.profile_intakes;
CREATE TRIGGER profile_intakes_set_updated_at
  BEFORE UPDATE ON public.profile_intakes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row level security: an intake belongs to exactly one maker.
-- Reads stay open because /profile/[id] renders skills and projects publicly.
ALTER TABLE public.profile_intakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Intakes are publicly readable" ON public.profile_intakes;
CREATE POLICY "Intakes are publicly readable"
  ON public.profile_intakes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Makers write their own intake" ON public.profile_intakes;
CREATE POLICY "Makers write their own intake"
  ON public.profile_intakes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
