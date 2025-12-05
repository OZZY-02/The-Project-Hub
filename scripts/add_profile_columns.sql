-- Migration: add missing profile columns and username unique index
-- Run this in Supabase SQL editor or via psql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS major_field text,
  ADD COLUMN IF NOT EXISTS passion_sector text,
  ADD COLUMN IF NOT EXISTS is_mentor boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_data_url text;

-- Create a case-insensitive unique index for username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (lower(username));

-- If you previously stored avatars in `avatar_url`, copy them to the new `avatar_data_url` column
UPDATE public.profiles
SET avatar_data_url = avatar_url
WHERE avatar_data_url IS NULL AND avatar_url IS NOT NULL;
