export const EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "yahoo.com",
  "outlook.com",
  "icloud.com",
  "proton.me",
  "live.com",
  "mail.com",
  "msn.com",
  "aol.com",
] as const;

export function getEmailSuggestions(value: string): string[] {
  const at = value.indexOf("@");
  if (at === -1) return [];

  const local = value.slice(0, at);
  const domainPart = value.slice(at + 1).toLowerCase();
  if (!local.trim()) return [];

  return EMAIL_DOMAINS.filter(
    (domain) => !domainPart || domain.startsWith(domainPart)
  )
    .map((domain) => `${local}@${domain}`)
    .slice(0, 8);
}
