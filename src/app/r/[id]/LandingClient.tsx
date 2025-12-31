"use client";
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatPhone, normalizePhone } from '@/lib/phone';
import Link from 'next/link';
import { inputClass } from '@/lib/styles';

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
  const normalized = normalizeHexColor(color) || '#4f46e5';
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

function LandingClientContent({ id }: { id: string }) {
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
  const [happyPhone, setHappyPhone] = useState('');
  const [happyConsent, setHappyConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showContactCapture, setShowContactCapture] = useState(false);

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

  useEffect(() => {
    setSubmitted(false);
    setError(null);
    if (rating === 5) {
      setHappyName('');
      setHappyEmail('');
      setHappyPhone('');
      setHappyConsent(true);
      setShowContactCapture(false);
      setTimeout(() => setShowContactCapture(true), 500);
    }
  }, [rating]);

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
      
      if (value === 5 && biz?.reviewLink) {
        sendEvent('google_opened', { rating: 5 });
        try {
          const url = biz.reviewLink.startsWith('http') ? biz.reviewLink : `https://${biz.reviewLink}`;
          const win = window.open(url, '_blank', 'noopener,noreferrer');
          if (!win) {
            console.warn('Popup blocked or failed to open');
          }
        } catch (e) {
          console.error('Failed to open Google review link:', e);
        }
      }
    },
    [biz?.reviewLink, sendEvent],
  );

  const primaryColor = useMemo(() => normalizeHexColor(biz?.brandColor) || '#4f46e5', [biz?.brandColor]);
  const backgroundStyle = useMemo(
    () => ({
      background: `radial-gradient(circle at top, ${mixWithWhite(primaryColor, 0.92)} 0%, ${mixWithWhite(primaryColor, 0.97)} 45%, #ffffff 100%)`,
    }),
    [primaryColor],
  );
  const cardBorderColor = useMemo(() => mixWithWhite(primaryColor, 0.85), [primaryColor]);

  const headline = biz?.headline?.trim() || 'How was your experience today?';
  const subheading = biz?.subheading?.trim() || (biz?.name ? `Share your feedback with ${biz.name}.` : 'Your voice helps us improve.');
  const displayName = biz?.name || (loading ? 'Loading…' : 'Reviews & Marketing');

  async function submitContactCapture() {
    if (!biz || submitting) return;
    const trimmedEmail = happyEmail.trim();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        businessId: biz.id,
        name: happyName.trim() || undefined,
        email: trimmedEmail,
        phone: normalizePhone(happyPhone).slice(0, 10) || undefined,
        consent: happyConsent,
        source: entrySource,
      };
      const res = await fetch('/api/feedback/contact-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Unable to save your information.');
      setSubmitted(true);
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submit() {
    if (!biz || rating == null || submitting) return;
    if (rating < 5) {
      if (!comment.trim() || !name.trim() || !isValidEmail(email.trim())) {
        setError('Please complete all required fields.');
        return;
      }
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: biz.id,
          rating,
          source: entrySource,
          name: name.trim(),
          email: email.trim(),
          phone: normalizePhone(phone).slice(0, 10) || undefined,
          comment: comment.trim(),
          consent: consent,
        }),
      });
      if (!res.ok) throw new Error('Unable to submit.');
      setSubmitted(true);
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const fiveStar = rating === 5;
  const ltFive = rating != null && rating < 5;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !biz) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-center">
        <div className="max-w-md">
          <h1 className="text-xl font-bold mb-2 text-slate-900">This link is unavailable</h1>
          <p className="text-slate-500 text-sm mb-6 font-medium">The business may have updated their link or it is no longer active.</p>
          <Link href="/" className="primary-button !h-10 !text-xs">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden" style={backgroundStyle}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -ml-32 -mb-32 pointer-events-none"></div>

      <div className="w-full max-w-xl relative z-10">
        <div
          className="premium-card p-8 sm:p-12 rounded-[40px] shadow-2xl transition-all duration-500"
          style={{ borderColor: cardBorderColor }}
        >
          {biz?.logoUrl ? (
            <div className="flex justify-center mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={biz.logoUrl} alt={`${displayName} logo`} className="h-20 w-auto object-contain drop-shadow-sm" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-2xl font-black tracking-tighter">
                {biz.name.slice(0, 1).toUpperCase()}
              </div>
            </div>
          )}

          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Verified Feedback
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">{headline}</h1>
            <p className="text-slate-500 text-sm sm:text-lg font-medium">{subheading}</p>
          </div>

          {!rating && !submitted && (
            <div className="space-y-10 animate-fade-in">
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = rating != null && rating >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      aria-pressed={active}
                      onClick={() => handleRating(n)}
                      className="group relative p-1 transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <svg className={`w-12 h-12 sm:w-16 sm:h-16 transition-colors duration-200 ${active ? 'text-amber-400' : 'text-slate-200 group-hover:text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {n === 5 && (
                        <span className="absolute -top-2 -right-2 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-brand"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Select your rating to continue</p>
            </div>
          )}

          {fiveStar && showContactCapture && (
            <div className="animate-fade-in">
              {submitted ? (
                <div className="py-10 text-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">You're all set!</h3>
                  <p className="text-slate-500 font-medium">Your info is saved. Keep an eye on your inbox for upcoming rewards.</p>
                  <p className="text-[10px] text-slate-400 mt-12 font-bold uppercase tracking-widest">You can close this tab now</p>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); submitContactCapture(); }}>
                  <div className="p-6 bg-brand/5 rounded-3xl border border-brand/10 text-center mb-8">
                    <div className="text-2xl mb-2">🎁</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Claim Your Rewards</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Since you had a 5-star experience, we'd love to send you exclusive rebates and promotions!
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name (Optional)</label>
                      <input
                        className={inputClass}
                        placeholder="John Doe"
                        value={happyName}
                        onChange={(e) => setHappyName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address <span className="text-brand">*</span></label>
                      <input
                        className={inputClass}
                        placeholder="name@company.com"
                        type="email"
                        value={happyEmail}
                        onChange={(e) => setHappyEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                      <input
                        className={inputClass}
                        placeholder="(555) 000-0000"
                        value={happyPhone}
                        onChange={(e) => setHappyPhone(formatPhone(normalizePhone(e.target.value).slice(0, 10)))}
                      />
                    </div>
                  </div>
                  
                  <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer group transition-colors hover:bg-slate-100">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                      checked={happyConsent}
                      onChange={(e) => setHappyConsent(e.target.checked)}
                    />
                    <span className="text-xs text-slate-500 leading-relaxed font-medium">Yes, I want to receive exclusive promotions, rebates, and updates from {biz?.name || 'this business'}.</span>
                  </label>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="primary-button w-full h-14 rounded-2xl text-lg shadow-xl shadow-brand/20"
                  >
                    {submitting ? 'Saving...' : '🎁 Claim Your Rewards'}
                  </button>
                </form>
              )}
            </div>
          )}

          {ltFive && (
            <div className="animate-fade-in">
              {submitted ? (
                <div className="py-10 text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Thank you</h3>
                  <p className="text-slate-500 font-medium">Your feedback has been sent directly to our management team for review.</p>
                  <p className="text-[10px] text-slate-400 mt-12 font-bold uppercase tracking-widest">You can close this tab now</p>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center mb-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Private Message</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      We're sorry your experience wasn't perfect. This note goes directly to our management team so we can make it right.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">What happened?</label>
                      <textarea
                        className={inputClass + " min-h-32 py-4 resize-none"}
                        placeholder="Tell us more about your experience..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Name</label>
                        <input
                          className={inputClass}
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <input
                          className={inputClass}
                          placeholder="name@email.com"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone (Optional)</label>
                      <input
                        className={inputClass}
                        placeholder="(555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(normalizePhone(e.target.value).slice(0, 10)))}
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer group transition-colors hover:bg-slate-100">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span className="text-xs text-slate-500 font-medium leading-relaxed">It's okay to contact me about this experience.</span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="primary-button w-full h-14 rounded-2xl text-lg shadow-xl shadow-slate-200"
                  >
                    {submitting ? 'Sending...' : 'Send Private Feedback'}
                  </button>
                </form>
              )}
            </div>
          )}

          {error && (
            <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Powered by <span className="text-slate-600">Reviews & Marketing</span>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LandingClient({ id }: { id: string }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div>
      </div>
    }>
      <LandingClientContent id={id} />
    </Suspense>
  );
}
