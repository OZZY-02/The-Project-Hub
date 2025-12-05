/*
  Script to create an `avatars` storage bucket in Supabase.
  Requires environment variables:
    - SUPABASE_URL
    - SUPABASE_SERVICE_ROLE_KEY

  Usage (locally):
    SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="<service_role_key>" node scripts/create_avatar_bucket.js

  Note: The service role key is sensitive. Do NOT commit it.
*/

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided as env vars');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  try {
    // Try to create a public bucket named 'avatars'
    const { data, error } = await supabase.storage.createBucket('avatars', { public: true });
    if (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('Bucket `avatars` already exists.');
      } else {
        console.error('Failed to create bucket:', error.message || error);
        process.exit(1);
      }
    } else {
      console.log('Created bucket `avatars`:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();
