/**
 * Accounts that receive Unlimited (pro) entitlements without a paid Stripe subscription.
 * Used for founders and QA — add INTERNAL_TEST_PRO_EMAILS (comma-separated) in Vercel for more.
 */
const HARDCODED_INTERNAL_TEST_PRO_EMAILS = [
  "mikeybobby718@godfare.com",
  "bladespindler@gmail.com",
  "volurer295@ovbest.com",
] as const;

function envInternalTestProEmails(): string[] {
  const raw = typeof process !== "undefined" ? process.env.INTERNAL_TEST_PRO_EMAILS || "" : "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function getInternalTestProEmails(): string[] {
  return Array.from(
    new Set([...HARDCODED_INTERNAL_TEST_PRO_EMAILS.map((e) => e.toLowerCase()), ...envInternalTestProEmails()])
  );
}

export function isInternalTestProEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return new Set(getInternalTestProEmails()).has(email.trim().toLowerCase());
}
