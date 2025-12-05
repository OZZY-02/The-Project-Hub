-- Add location_country and location_city columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location_country text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS location_city text;
