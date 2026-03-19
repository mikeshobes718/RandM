/**
 * Single source of truth for post-auth routing.
 *
 * Every page that needs to decide "where should this user go?" calls this
 * function with a Bearer token. The rules are simple and applied in order:
 *
 *   1. Has a business  →  /dashboard
 *   2. Has a plan       →  /onboarding/business
 *   3. Neither          →  /select-plan
 *   4. Any API error    →  /dashboard   (fail-open for authenticated users)
 */
export async function resolveRoute(token: string): Promise<string> {
  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  const opts: RequestInit = { headers, credentials: 'include' };

  try {
    const bizRes = await fetch('/api/businesses/me', opts);
    if (bizRes.ok) {
      const bizData = await bizRes.json();
      if (bizData?.business?.id) return '/dashboard';
    } else if (bizRes.status === 401) {
      return '/login';
    }
  } catch {
    return '/dashboard';
  }

  try {
    const planRes = await fetch('/api/plan/status', opts);
    if (planRes.ok) {
      const planData = await planRes.json();
      if (planData.status === 'none') return '/select-plan';
      return '/onboarding/business';
    }
  } catch {
    // Can't determine plan — let dashboard handle it
  }

  return '/dashboard';
}
