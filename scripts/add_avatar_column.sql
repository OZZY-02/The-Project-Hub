-- Add avatar_data_url column to profiles table to store image data URIs
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_data_url text;
