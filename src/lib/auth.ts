const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

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
 * Supabase signOut() can hang here because it still calls the remote /logout
 * endpoint before clearing local storage. Clear storage directly and reload.
 */
export function signOutUser(): void {
  clearSupabaseAuthStorage();

  if (typeof window !== "undefined") {
    window.location.assign("/");
  }
}
