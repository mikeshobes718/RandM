"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatPhone, normalizePhone } from '@/lib/phone';

type Biz = {
  id: string;
  name: string;
  reviewLink: string;
  brandColor?: string | null;
  buttonColor?: string | null;
  logoUrl?: string | null;
  headline?: string | null;
  subheading?: string | null;
};

type ReviewEventName = 'page_opened' | 'rating_selected' | 'feedback_submitted' | 'google_opened';

function normalizeHexColor(color?: string | null): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (/^#?[0-9a-fA-F]{6}$/.test(trimmed)) {
    const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
    return `#${hex.toLowerCase()}`;
  }
  if (/^#?[0-9a-fA-F]{3}$/.test(trimmed)) {
    const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
    const expanded = hex.split('').map((c) => `${c}${c}`).join('');
    return `#${expanded.toLowerCase()}`;
  }
  return null;
}

function mixWithWhite(color: string, ratio: number): string {
  const normalized = normalizeHexColor(color) || '#2563eb';
  const clampRatio = Math.min(1, Math.max(0, ratio));
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * clampRatio);
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function getReadableTextColor(color?: string | null): string {
  const normalized = normalizeHexColor(color);
  if (!normalized) return '#ffffff';
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111827' : '#ffffff';
}

function normalizeSource(value: string | null): string {
  if (!value) return 'landing';
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 32);
  return cleaned || 'landing';
}

function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export default function LandingClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const [biz, setBiz] = useState<Biz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [consent, setConsent] = useState(false);
  const [happyName, setHappyName] = useState('');
  const [happyEmail, setHappyEmail] = useState('');
  const [happyConsent, setHappyConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastRedirect, setLastRedirect] = useState<string | null>(null);

  const entrySource = useMemo(() => {
    if (!searchParams) return 'landing';
    return normalizeSource(
      searchParams.get('source') ||
        searchParams.get('s') ||
        searchParams.get('channel') ||
        searchParams.get('utm_source') ||
        null,
    );
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const response = await fetch(`/api/public/business?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Not found');
        const data = await response.json();
        setBiz(data);
      } catch {
        setError('This page is unavailable.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    setSubmitted(false);
    setError(null);
    if (rating === 5) {
      setHappyName('');
      setHappyEmail('');
      setHappyConsent(true);
    }
  }, [rating]);

  const sendEvent = useCallback(
    (event: ReviewEventName, payload?: { rating?: number; metadata?: Record<string, unknown> }) => {
      const businessId = biz?.id || id;
      if (!businessId) return;
      const body: Record<string, unknown> = { businessId, event, source: entrySource };
      if (payload?.rating != null) body.rating = payload.rating;
      if (payload?.metadata && Object.keys(payload.metadata).length) body.metadata = payload.metadata;
      fetch('/api/feedback/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(() => {});
    },
    [biz?.id, entrySource, id],
  );

  const pageOpened = useRef(false);
  useEffect(() => {
    pageOpened.current = false;
  }, [id]);
  useEffect(() => {
    if (!biz || pageOpened.current) return;
    pageOpened.current = true;
    sendEvent('page_opened');
  }, [biz, sendEvent]);

  const handleRating = useCallback(
    (value: number) => {
      setRating(value);
      sendEvent('rating_selected', { rating: value });
    },
    [sendEvent],
  );

  const primaryColor = useMemo(() => normalizeHexColor(biz?.brandColor) || '#2563eb', [biz?.brandColor]);
  const buttonColor = useMemo(() => normalizeHexColor(biz?.buttonColor) || primaryColor, [biz?.buttonColor, primaryColor]);
  const buttonTextColor = useMemo(() => getReadableTextColor(buttonColor), [buttonColor]);
  const backgroundStyle = useMemo(
    () => ({
      background: `radial-gradient(circle at top, ${mixWithWhite(primaryColor, 0.92)} 0%, ${mixWithWhite(primaryColor, 0.97)} 45%, #ffffff 100%)`,
    }),
    [primaryColor],
  );
  const cardBorderColor = useMemo(() => mixWithWhite(primaryColor, 0.85), [primaryColor]);
  const starActiveColor = useMemo(() => mixWithWhite(primaryColor, 0.2), [primaryColor]);

  const headline = biz?.headline?.trim() || 'How was your experience today?';
  const subheading = biz?.subheading?.trim() || (biz?.name ? `Share your feedback with ${biz.name}.` : 'Your voice helps us improve.');
  const displayName = biz?.name || (loading ? 'Loading…' : 'Reviews & Marketing');

  async function submit() {
    if (!biz || rating == null || submitting) return;

    if (rating < 5) {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const trimmedComment = comment.trim();
      if (!trimmedComment || !trimmedName || !trimmedEmail) {
        setError('Please share your name, email, and feedback so we can follow up.');
        return;
      }
      if (!isValidEmail(trimmedEmail)) {
        setError('Enter a valid email address so we can stay in touch.');
        return;
      }
    } else if (rating >= 5) {
      const trimmedEmail = happyEmail.trim();
      if (!trimmedEmail) {
        setError('Enter your email so we can send a thank-you perk.');
        return;
      }
      if (!isValidEmail(trimmedEmail)) {
        setError('Please enter a valid email address before continuing to Google.');
        return;
      }
    }

    let pendingWindow: Window | null = null;
    if (rating >= 5 && typeof window !== 'undefined') {
      // Pre-open a blank tab synchronously to avoid popup blockers
      try { pendingWindow = window.open('about:blank', '_blank', 'noopener'); } catch { pendingWindow = null; }
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload: Record<string, unknown> = {
        businessId: biz.id,
        rating,
        source: entrySource,
      };
      if (rating < 5) {
        payload.name = name.trim();
        payload.email = email.trim();
        const phoneDigits = normalizePhone(phone).slice(0, 10);
        payload.phone = phoneDigits || undefined;
        payload.comment = comment.trim();
        payload.consent = consent;
      } else {
        const trimmedHappyEmail = happyEmail.trim();
        const trimmedHappyName = happyName.trim();
        payload.email = trimmedHappyEmail;
        if (trimmedHappyName) payload.name = trimmedHappyName;
        payload.consent = happyConsent;
      }
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Unable to submit right now. Please try again.');
      }
      const data = await res.json();
      if (rating >= 5 && data.redirect) {
        try { setLastRedirect(String(data.redirect)); } catch {}
        setSubmitted(true);
        const destination = String(data.redirect);
        try {
          if (pendingWindow) {
            pendingWindow.location.href = destination;
            try { pendingWindow.focus(); } catch {}
          } else {
            window.location.assign(destination);
          }
          return;
        } catch {}
      }
      setSubmitted(true);
      if (rating >= 5) {
        try {
          // Persist a best-effort fallback from loaded business
          if (!lastRedirect && biz?.reviewLink) setLastRedirect(biz.reviewLink);
        } catch {}
        setError(null);
        if (pendingWindow) {
          try { pendingWindow.close(); } catch {}
        }
      }
    } catch (e) {
      if (pendingWindow) {
        try { pendingWindow.close(); } catch {}
      }
      const message = e instanceof Error && e.message ? e.message : 'Something went wrong. Please try again.';
      setError(message);
      // On 5-star flow, still surface the fallback UI so users can proceed to Google
      if (rating >= 5) {
        try {
          if (!lastRedirect && biz?.reviewLink) setLastRedirect(biz.reviewLink);
        } catch {}
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
      pendingWindow = null;
    }
  }

  const fiveStar = rating === 5;
  const ltFive = rating != null && rating < 5;

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6" style={backgroundStyle}>
      <div className="w-full max-w-xl">
        <div
          className="rounded-3xl border bg-white/90 backdrop-blur-sm p-6 sm:p-8 shadow-xl transition"
          style={{ borderColor: cardBorderColor }}
        >
          {biz?.logoUrl && (
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={biz.logoUrl} alt={`${displayName} logo`} className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
            </div>
          )}
          <div className="text-center space-y-2">
            <div className="text-xs uppercase tracking-wide text-gray-500">{displayName}</div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">{headline}</h1>
            <p className="text-gray-600 text-sm sm:text-base">{subheading}</p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = rating != null && rating >= n;
              return (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  aria-pressed={active}
                  onClick={() => handleRating(n)}
                  className={`p-2 rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${active ? 'scale-110' : 'scale-100'}`}
                  style={{ color: active ? starActiveColor : '#d1d5db' }}
                >
                  <svg className="w-12 h-12" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              );
            })}
          </div>

          {rating == null && !loading && (
            <p className="text-center text-gray-500 mt-5">Tap a star to continue.</p>
          )}

          {fiveStar && (
            <div className="mt-6">
              {submitted ? (
                <div className="rounded-xl bg-emerald-50 text-emerald-700 px-4 py-6 text-center text-sm">
                  <div>Thanks for sending your info!</div>
                  <div className="mt-2 text-emerald-700">
                    {lastRedirect || biz?.reviewLink ? (
                      <a
                        href={(lastRedirect || biz?.reviewLink) as string}
                        target="_blank"
                        rel="noopener"
                        className="underline font-semibold"
                      >
                        Click here to open Google and leave your review
                      </a>
                    ) : (
                      <span>If Google didn’t open automatically, you can close this tab and try again.</span>
                    )}
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
                  <div className="rounded-xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm text-center">
                    Thanks for the love! Drop your info so we can send perks and reminders before we pop you over to Google.
                  </div>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    placeholder="Your name (optional)"
                    value={happyName}
                    onChange={(e) => setHappyName(e.target.value)}
                  />
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    placeholder="Email for rewards & follow-up"
                    type="email"
                    value={happyEmail}
                    onChange={(e) => setHappyEmail(e.target.value)}
                    required
                  />
                  <label className="flex items-start gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={happyConsent}
                      onChange={(e) => setHappyConsent(e.target.checked)}
                    />
                    <span>Keep me posted about promos and follow up if there’s anything else you need.</span>
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl px-4 py-3 text-base font-semibold shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                  >
                    {submitting ? 'Opening Google…' : 'Send & leave a Google review'}
                  </button>
                  <p className="text-xs text-gray-500 text-center">We’ll open Google in a new tab right after you tap the button.</p>
                  {submitted && fiveStar && (
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      If a new tab didn’t open,{' '}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          // Try to fetch redirect again as a fallback
                          void (async () => {
                            try {
                              const r = await fetch(`/api/public/business?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
                              const j = await r.json().catch(() => null) as { google_maps_write_review_uri?: string; review_link?: string } | null;
                              const dest = j?.google_maps_write_review_uri || j?.review_link;
                              if (dest) window.location.href = dest;
                            } catch {}
                          })();
                        }}
                        className="underline"
                      >
                        click here to open Google
                      </a>.
                    </p>
                  )}
                </form>
              )}
            </div>
          )}

          {ltFive && (
            <div className="mt-6">
              {submitted ? (
                <div className="rounded-xl bg-blue-50 text-blue-700 px-4 py-6 text-center text-sm">
                  Thanks for sharing. We’ll review your note right away and, if you asked us to reach out, we’ll be in touch.
                </div>
              ) : (
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
                  <div className="text-center text-amber-700 text-sm">
                    We’re sorry it wasn’t perfect. This note stays private with our team.
                  </div>
                  <textarea
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 min-h-32 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    placeholder="Tell us what happened so we can make it right."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    placeholder="Phone (optional)"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(normalizePhone(e.target.value).slice(0, 10)))}
                  />
                  <label className="flex items-start gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span>It’s okay to contact me about this experience.</span>
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-gray-900 text-white px-4 py-3 text-base font-semibold shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Sending…' : 'Send private feedback'}
                  </button>
                </form>
              )}
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
