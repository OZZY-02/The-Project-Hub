import { createClient } from '@supabase/supabase-js';
import { createMissingSupabaseEnvError, hasSupabaseEnv } from './env';

const isConfigured = hasSupabaseEnv();

if (!isConfigured && typeof window !== 'undefined') {
  console.warn(createMissingSupabaseEnvError().message);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-supabase-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export default supabase;
