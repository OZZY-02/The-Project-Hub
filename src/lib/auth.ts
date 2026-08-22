import supabase from "./supabaseClient";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SIGN_OUT_TIMEOUT_MS = 5000;

function getSupabaseProjectRef(): string | null {
  if (!SUPABASE_URL) return null;
  try {
    return new URL(SUPABASE_URL).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

export function clearSupabaseAuthStorage(): void {
  if (typeof window === "undefined") return;

  const projectRef = getSupabaseProjectRef();
  const prefix = projectRef ? `sb-${projectRef}-` : "sb-";

  for (const storage of [window.localStorage, window.sessionStorage]) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key?.startsWith(prefix)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => storage.removeItem(key));
  }
}

/**
 * Prefer server-side global sign-out so refresh tokens are revoked.
 * If the remote /logout call hangs, fall back to clearing local storage.
 */
export async function signOutUser(): Promise<void> {
  try {
    await Promise.race([
      supabase.auth.signOut({ scope: "global" }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("signOut timeout")), SIGN_OUT_TIMEOUT_MS)
      ),
    ]);
  } catch {
    clearSupabaseAuthStorage();
  }

  if (typeof window !== "undefined") {
    window.location.assign("/");
  }
}
