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
  website?: string | null;
};

type ReviewEventName = 
  | 'page_opened' 
  | 'rating_selected' 
  | 'feedback_submitted' 
  | 'google_opened'
  | 'sentiment_selected'
  | 'flow_completed';

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
  const [sentiment, setSentiment] = useState<'positive' | 'negative' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    (event: ReviewEventName, payload?: { sentiment?: string; metadata?: Record<string, unknown> }) => {
      const businessId = biz?.id || id;
      if (!businessId) return;
      const body: Record<string, unknown> = { businessId, event, source: entrySource };
      if (payload?.sentiment) body.sentiment = payload.sentiment;
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
    if (!biz || pageOpened.current) return;
    pageOpened.current = true;
    sendEvent('page_opened');
  }, [biz, sendEvent]);

  const handleSentiment = useCallback(
    (value: 'positive' | 'negative') => {
      setSentiment(value);
      sendEvent('sentiment_selected', { sentiment: value });
    },
    [sendEvent],
  );

  const handleGoogleReview = useCallback(() => {
    if (!biz?.reviewLink) return;
    sendEvent('google_opened', { sentiment: sentiment || 'positive' });
    sendEvent('flow_completed', { metadata: { destination: 'google', sentiment: sentiment || 'positive' } });
    const url = biz.reviewLink.startsWith('http') ? biz.reviewLink : `https://${biz.reviewLink}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [biz?.reviewLink, sendEvent, sentiment]);

  const primaryColor = useMemo(() => normalizeHexColor(biz?.brandColor) || '#4f46e5', [biz?.brandColor]);
  const backgroundStyle = useMemo(
    () => ({
      background: `radial-gradient(circle at top, ${mixWithWhite(primaryColor, 0.92)} 0%, ${mixWithWhite(primaryColor, 0.97)} 45%, #ffffff 100%)`,
    }),
    [primaryColor],
  );
  const cardBorderColor = useMemo(() => mixWithWhite(primaryColor, 0.85), [primaryColor]);

  const displayName = biz?.name || (loading ? 'Loading…' : 'Reviews & Marketing');

  async function submitContactCapture() {
    if (!biz || submitting) return;
    if (!email.trim() && !phone.trim()) {
      handleGoogleReview();
      return;
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        businessId: biz.id,
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: normalizePhone(phone).slice(0, 10) || undefined,
        consent: true,
        source: entrySource,
      };
      const res = await fetch('/api/feedback/contact-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Unable to save your information.');
      sendEvent('flow_completed', { metadata: { destination: 'contact_capture', sentiment: 'positive' } });
      setSubmitted(true);
      handleGoogleReview();
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitFeedback() {
    if (!biz || submitting) return;
    if (!comment.trim()) {
      setError('Please tell us what went wrong.');
      return;
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: biz.id,
          rating: 1, // Defaulting to 1 for negative sentiment private feedback
          source: entrySource,
          name: name.trim() || 'Valued Customer',
          email: email.trim() || 'no-email@provided.com',
          phone: normalizePhone(phone).slice(0, 10) || undefined,
          comment: comment.trim(),
          consent: true,
        }),
      });
      if (!res.ok) throw new Error('Unable to submit.');
      sendEvent('feedback_submitted', { metadata: { sentiment: 'negative' } });
      sendEvent('flow_completed', { metadata: { destination: 'private_feedback', sentiment: 'negative' } });
      setSubmitted(true);
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !biz) {
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
              <div className="px-6 py-3 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-xl font-bold tracking-tight">
                {biz?.name || 'Reviews & Marketing'}
              </div>
            </div>
          )}

          {/* Screen 1: Sentiment Selection */}
          {!sentiment && !submitted && (
            <div className="animate-fade-in text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">
                Verified Feedback
              </div>
              <div className="space-y-3 mb-10">
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">How was your experience today?</h1>
                <p className="text-slate-500 text-sm sm:text-lg font-medium">
                  {biz?.subheading?.trim() || (biz?.name ? `Share your feedback with ${biz.name}.` : 'Your voice helps us improve.')}
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => handleSentiment('positive')}
                  className="w-full h-16 rounded-2xl bg-[#22C55E] text-white text-xl font-black shadow-lg shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  😊 Great!
                </button>
                <button
                  onClick={() => handleSentiment('negative')}
                  className="w-full h-12 rounded-2xl bg-[#6B7280] text-white text-md font-bold hover:bg-slate-600 active:scale-[0.98] transition-all"
                >
                  😕 Could be better
                </button>
              </div>
            </div>
          )}

          {/* Screen 2A: Happy Path */}
          {sentiment === 'positive' && !submitted && (
            <div className="animate-fade-in">
              <button 
                onClick={() => setSentiment(null)}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest mb-6 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Back
              </button>
              
              <div className="text-center space-y-3 mb-10">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">Thanks! We'd love your review on Google</h2>
              </div>

              <div className="space-y-8">
                <button
                  onClick={handleGoogleReview}
                  className="w-full h-16 rounded-2xl bg-brand text-white text-lg font-black shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  ⭐ Leave Google Review
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                  <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-slate-300"><span className="bg-white px-4">Optional</span></div>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-600">Want special offers?</p>
                  </div>
                  <div className="space-y-3">
                    <input
                      className={inputClass}
                      placeholder="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                      className={inputClass}
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                    />
                  </div>
                  <button
                    onClick={submitContactCapture}
                    disabled={submitting}
                    className="w-full h-12 rounded-2xl bg-slate-100 text-slate-900 font-bold hover:bg-slate-200 transition-all"
                  >
                    {submitting ? 'Saving...' : 'Keep Me Updated'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Screen 2B: Feedback Path */}
          {sentiment === 'negative' && !submitted && (
            <div className="animate-fade-in">
              <button 
                onClick={() => setSentiment(null)}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest mb-6 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Back
              </button>

              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); submitFeedback(); }}>
                <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Tell Us More</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Your feedback goes straight to our team so we can make things right.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">What went wrong?</label>
                  <textarea
                    className={inputClass + " min-h-32 py-4 resize-none"}
                    placeholder="Tell us about your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">How can we reach you to make this right?</label>
                  <input
                    className={inputClass}
                    placeholder="Email or phone (optional)"
                    value={email || phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.includes('@')) {
                        setEmail(val);
                        setPhone('');
                      } else {
                        setPhone(formatPhone(val));
                        setEmail('');
                      }
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 rounded-2xl bg-brand text-white text-lg font-black shadow-xl shadow-brand/20 active:scale-[0.98] transition-all"
                >
                  {submitting ? 'Sending...' : 'Submit Feedback'}
                </button>

                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={handleGoogleReview}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold transition-colors underline underline-offset-4"
                  >
                    Or leave a public review on Google
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Thank You Screen (After Submission) */}
          {submitted && (
            <div className="animate-fade-in py-10 text-center">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3">Thank you for your feedback</h3>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                We appreciate you taking the time to let us know. A member of our team will be in touch soon.
              </p>
              
              {biz?.website && (
                <div className="mt-12">
                  <a 
                    href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
                    className="text-brand font-bold hover:underline flex items-center justify-center gap-1"
                  >
                    Return to {biz.name} website
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </a>
                </div>
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
