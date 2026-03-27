/**
 * Emails that may access /admin (AdminGuard) and see admin nav.
 * Also merge NEXT_PUBLIC_ADMIN_EMAILS (comma-separated) at build time.
 */
const HARDCODED_ADMIN_EMAILS = [
  "mikeshobes718@yahoo.com",
  "volurer295@ovbest.com",
  "mikeybobby718@godfare.com",
] as const;

function envAdminEmails(): string[] {
  const raw = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_ADMIN_EMAILS || "" : "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminEmails(): string[] {
  return Array.from(
    new Set([...HARDCODED_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...envAdminEmails()])
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const set = new Set(getAdminEmails());
  return set.has(email.trim().toLowerCase());
}
