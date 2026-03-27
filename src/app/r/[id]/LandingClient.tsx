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
  const normalized = normalizeHexColor(color) || '#003ea9';
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
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-+/, '').replace(/-+$/, '').slice(0, 32);
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
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const entrySource = useMemo(() => {
    if (!searchParams) return 'landing';
    return normalizeSource(searchParams.get('source') || searchParams.get('s') || searchParams.get('channel') || searchParams.get('utm_source') || null);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const response = await fetch(`/api/public/business?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Not found');
        setBiz(await response.json());
      } catch {
        setError('This page is unavailable.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => { setSubmitted(false); setError(null); }, [rating]);

  const sendEvent = useCallback(
    (event: ReviewEventName, payload?: { rating?: number; metadata?: Record<string, unknown> }) => {
      const businessId = biz?.id || id;
      if (!businessId) return;
      const body: Record<string, unknown> = { businessId, event, source: entrySource };
      if (payload?.rating != null) body.rating = payload.rating;
      if (payload?.metadata && Object.keys(payload.metadata).length) body.metadata = payload.metadata;
      fetch('/api/feedback/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});
    },
    [biz?.id, entrySource, id],
  );

  const pageOpened = useRef(false);
  useEffect(() => { pageOpened.current = false; }, [id]);
  useEffect(() => {
    if (!biz || pageOpened.current) return;
    pageOpened.current = true;
    sendEvent('page_opened');
  }, [biz, sendEvent]);

  const handleRating = useCallback((value: number) => {
    setRating(value);
    sendEvent('rating_selected', { rating: value });
  }, [sendEvent]);

  const primaryColor = useMemo(() => normalizeHexColor(biz?.brandColor) || '#003ea9', [biz?.brandColor]);
  const buttonColor = useMemo(() => normalizeHexColor(biz?.buttonColor) || primaryColor, [biz?.buttonColor, primaryColor]);
  const buttonTextColor = useMemo(() => getReadableTextColor(buttonColor), [buttonColor]);

  const headline = biz?.headline?.trim() || 'How was your experience today?';
  const subheading = biz?.subheading?.trim() || (biz?.name ? `Share your feedback with ${biz.name}.` : 'Your voice helps us improve.');
  const displayName = biz?.name || '';

  async function submitPrivateFeedback() {
    if (!biz || rating == null || submitting) return;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedComment = comment.trim();
    if (!trimmedComment || !trimmedName || (!trimmedEmail && !phone)) {
      setError('Please share your name, feedback, and at least one contact method.');
      return;
    }
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setError('Enter a valid email address so we can stay in touch.');
      return;
    }
    if (!consent) {
      setError('Please agree to be contacted so we can resolve your issue.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: biz.id, rating, source: entrySource,
          name: trimmedName || undefined, email: trimmedEmail || undefined,
          phone: normalizePhone(phone).slice(0, 10) || undefined,
          comment: trimmedComment, consent,
        }),
      });
      if (!res.ok) throw new Error((await res.text()) || 'Unable to submit right now.');
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleFiveStarClick = () => {
    if (!biz || rating == null) return;
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (biz.reviewLink) window.open(biz.reviewLink, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
    setError(null);
    if (trimmedName || trimmedEmail || phone) {
      fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: biz.id, rating, source: entrySource,
          name: trimmedName || undefined, email: trimmedEmail || undefined,
          phone: normalizePhone(phone).slice(0, 10) || undefined,
          consent: !!(trimmedEmail || phone),
        }),
      }).catch(console.error);
    } else {
      sendEvent('google_opened', { rating: 5 });
    }
  };

  const fiveStar = rating === 5;
  const ltFive = rating != null && rating < 5;

  const inputCls = "w-full h-12 border border-outline-variant/30 rounded-xl px-4 text-base font-medium bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-surface relative overflow-hidden">
      {/* Gradient Background Orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-container/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-fixed/30 blur-[120px]" />
      </div>

      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <header className="mb-10 flex flex-col items-center text-center">
          {biz?.logoUrl && (
            <div className="mb-6 relative">
              <div className="w-20 h-20 bg-surface-container-lowest rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
                <img src={biz.logoUrl} alt={`${displayName} logo`} className="w-14 h-14 object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-secondary text-white p-1 rounded-full shadow-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            </div>
          )}
          {displayName && (
            <h2 className="display-font text-on-surface-variant text-sm font-semibold tracking-widest uppercase">{displayName}</h2>
          )}
          <h1 className="display-font text-3xl md:text-4xl font-extrabold text-on-surface mt-3 tracking-tight">{headline}</h1>
          {!rating && <p className="text-on-surface-variant mt-2">{subheading}</p>}
        </header>

        {/* Feedback Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-sm border border-white/50 space-y-6">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = rating != null && rating >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    onClick={() => handleRating(n)}
                    className="transition-all duration-200 active:scale-90"
                  >
                    <span
                      className={`material-symbols-outlined text-4xl md:text-5xl ${active ? 'text-primary' : 'text-outline-variant'}`}
                      style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      star
                    </span>
                  </button>
                );
              })}
            </div>
            {rating == null && !loading && (
              <p className="text-on-surface-variant text-sm">Tap a star to continue</p>
            )}
            {rating && (
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great' : rating === 3 ? 'Okay' : rating === 2 ? 'Poor' : 'Very poor'}
              </p>
            )}
          </div>

          {/* 5-Star Flow */}
          {fiveStar && (
            <div className="space-y-4 animate-fade-in">
              {submitted ? (
                <div className="rounded-xl bg-emerald-50 text-emerald-700 px-4 py-6 text-center text-sm">
                  <span className="material-symbols-outlined text-3xl mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
                  <p className="font-semibold">Thank you! Google Reviews has opened in a new tab.</p>
                  <p className="text-xs mt-1 text-emerald-600">We really appreciate your support!</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl bg-emerald-50 text-emerald-700 px-4 py-3 text-sm text-center">
                    Thanks for the love! Fill in your info below, then tap the button to post a Google review.
                  </div>
                  <div className="space-y-3">
                    <input className={inputCls} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                    <input className={inputCls} placeholder="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input className={inputCls} placeholder="Phone number" value={phone} onChange={(e) => setPhone(formatPhone(normalizePhone(e.target.value).slice(0, 10)))} />
                    <p className="text-[10px] text-on-surface-variant/60 text-center">Optional — for promotions and rebates.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleFiveStarClick}
                    disabled={submitting}
                    className="w-full rounded-xl px-4 py-3.5 text-base font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                    style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                  >
                    Leave a Google Review
                  </button>
                  <p className="text-xs text-on-surface-variant/60 text-center">Opens Google in a new tab</p>
                </>
              )}
            </div>
          )}

          {/* 1-4 Star Private Feedback */}
          {ltFive && (
            <div className="animate-fade-in">
              {submitted ? (
                <div className="rounded-xl bg-primary-fixed text-on-primary-fixed px-4 py-6 text-center text-sm">
                  <span className="material-symbols-outlined text-3xl mb-2 block">mark_email_read</span>
                  Thanks for sharing. We&apos;ll review your note right away and be in touch.
                </div>
              ) : (
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submitPrivateFeedback(); }}>
                  <div className="text-center text-amber-700 text-sm bg-amber-50 rounded-xl px-4 py-3">
                    We&apos;re sorry it wasn&apos;t perfect. This note stays private with our team.
                  </div>
                  <textarea
                    className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 min-h-32 text-base font-medium bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder="Tell us what happened so we can make it right."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                  <input className={inputCls} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                  <input className={inputCls} placeholder="Email (optional if phone provided)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input className={inputCls} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(formatPhone(normalizePhone(e.target.value).slice(0, 10)))} />

                  <div className="p-4 bg-surface-container-low rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        required
                      />
                      <div className="text-xs text-on-surface-variant leading-tight">
                        <span className="font-bold text-on-surface block mb-0.5">I agree to be contacted</span>
                        By checking this box, you agree to receive SMS and email communications regarding your feedback and future promotions. You can opt-out at any time.
                      </div>
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !consent}
                    className="w-full rounded-xl bg-inverse-surface text-inverse-on-surface px-4 py-3.5 text-base font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send private feedback'}
                  </button>
                  {biz?.reviewLink && (
                    <div className="text-center">
                      <a href={biz.reviewLink} target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant/60 hover:text-primary underline">
                        Or leave a public review on Google
                      </a>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-error/20 bg-error-container px-4 py-3 text-on-error-container text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Compliance Disclaimer */}
        <div className="mt-8 text-center px-4">
          <p className="text-[10px] text-on-surface-variant/50 font-medium leading-relaxed max-w-sm mx-auto">
            Your feedback is private and handled in accordance with our Privacy Policy. We value honest feedback and do not incentivize or gate reviews.
          </p>
          <p className="text-[9px] text-on-surface-variant/30 mt-4 font-medium">
            Powered by Reviews &amp; Marketing
          </p>
        </div>
      </div>
    </main>
  );
}
