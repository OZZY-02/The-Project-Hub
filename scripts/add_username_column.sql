-- Add a username column and case-insensitive unique index to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text;

-- Create a case-insensitive unique index to enforce uniqueness regardless of case
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'profiles_username_lower_idx'
  ) THEN
    CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles ((lower(username)));
  END IF;
END$$;
