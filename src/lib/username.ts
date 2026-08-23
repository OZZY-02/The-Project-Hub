import supabase from "./supabaseClient";

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export function normalizeUsername(value: string): string {
  return value.trim();
}

export function isValidUsername(value: string): boolean {
  const uname = normalizeUsername(value);
  return uname.length >= 3 && uname.length <= 30 && USERNAME_PATTERN.test(uname);
}

export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string | null
): Promise<boolean> {
  const uname = normalizeUsername(username);
  if (!isValidUsername(uname)) return false;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", uname);

  if (!existing?.length) return true;
  if (excludeUserId && existing.length === 1 && existing[0].id === excludeUserId) {
    return true;
  }
  return false;
}

export function suggestUsernames(base: string): string[] {
  const clean = normalizeUsername(base)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^\.+|\.+$/g, "");
  const stem = clean || "maker";
  const year = new Date().getFullYear();
  const rand = () => String(Math.floor(100 + Math.random() * 900));

  const candidates = [
    `${stem}_${rand()}`,
    `${stem}${year}`,
    `${stem}.hub`,
    `${stem}_sd`,
    `${stem}${rand()}`,
  ];

  return [...new Set(candidates)].slice(0, 4);
}
