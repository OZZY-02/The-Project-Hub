type EnvSource = Record<string, string | undefined>;

export function missingEnvKeys(keys: string[], env: EnvSource = process.env): string[] {
  return keys.filter((key) => !env[key]);
}

export function requireEnv(keys: string[], env: EnvSource = process.env): Record<string, string> {
  const missing = missingEnvKeys(keys, env);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return Object.fromEntries(keys.map((key) => [key, env[key]!]));
}

export function createMissingSupabaseEnvError(env: EnvSource = process.env): Error {
  const missing = missingEnvKeys(
    ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    env
  );

  return new Error(
    `Supabase is not configured. Add ${missing.join(", ")} to .env.local and restart the server.`
  );
}

export function hasSupabaseEnv(env: EnvSource = process.env): boolean {
  return (
    missingEnvKeys(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"], env).length === 0
  );
}
