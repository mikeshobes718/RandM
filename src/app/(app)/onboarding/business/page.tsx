"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

type Suggestion = { placeId: string; mainText: string; secondaryText: string };
type Details = {
  id: string;
  displayName?: string;
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  writeAReviewUri?: string;
  lat?: number;
  lng?: number;
};

type ExistingBusiness = {
  name?: string | null;
  google_place_id?: string | null;
  google_maps_place_uri?: string | null;
  google_maps_write_review_uri?: string | null;
  review_link?: string | null;
  address?: string | null;
  google_rating?: number | null;
};

function newSessionToken() { return crypto.randomUUID(); }

export default function ConnectBusiness() {
  const [sessionToken, setSessionToken] = useState<string>(() => newSessionToken());
  const [input, setInput] = useState('');
  const [region, setRegion] = useState<string>('auto');
  const [coords, setCoords] = useState<{lat:number;lng:number}|null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Details | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [planAllowed, setPlanAllowed] = useState<boolean>(true);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const copyTimerRef = useRef<number | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  // If a business is already connected, send user to the dashboard immediately (unless editing)
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const editing = params.get('edit') === '1';
        if (editing) return;
        const tok = typeof window !== 'undefined' ? localStorage.getItem('idToken') : null;
        const headers: Record<string,string> = tok ? { Authorization: `Bearer ${tok}` } : {};
        let r = await fetch('/api/businesses/me', { cache: 'no-store', credentials: 'include', headers });
        if (!r.ok) r = await fetch('/api/businesses/me', { cache: 'no-store', headers });
        if (r.ok) {
          const j = await r.json();
          if (j && j.business) {
            window.location.replace('/dashboard');
            return;
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('edit') !== '1') return;
        const tok = typeof window !== 'undefined' ? localStorage.getItem('idToken') : null;
        const headers: Record<string, string> = tok ? { Authorization: `Bearer ${tok}` } : {};
        let r = await fetch('/api/businesses/me', { cache: 'no-store', credentials: 'include', headers });
        if (!r.ok) r = await fetch('/api/businesses/me', { cache: 'no-store', headers });
        if (!r.ok) return;
        const data = await r.json().catch(() => null) as { business?: ExistingBusiness | null } | null;
        const biz = data?.business;
        if (!biz || !biz.name) return;
        if (!cancelled) setInput(biz.name);
        let details: Details | null = null;
        if (biz.google_place_id) {
          details = await getDetails(biz.google_place_id);
        }
        if (cancelled) return;
        if (details) {
          details = {
            ...details,
            googleMapsUri: details.googleMapsUri || biz.google_maps_place_uri || undefined,
            writeAReviewUri: details.writeAReviewUri || biz.google_maps_write_review_uri || biz.review_link || undefined,
          };
        } else {
          details = {
            id: biz.google_place_id || biz.name || 'existing-business',
            displayName: biz.name || undefined,
            formattedAddress: biz.address || undefined,
            googleMapsUri: biz.google_maps_place_uri || undefined,
            writeAReviewUri: biz.google_maps_write_review_uri || biz.review_link || undefined,
            rating: typeof biz.google_rating === 'number' ? biz.google_rating : undefined,
          };
        }
        if (!cancelled && details) {
          setSelected(details);
          setSuggestions([]);
          setSessionToken(newSessionToken());
          setToast('Loaded your current business details. Save to confirm any changes.');
          if (typeof window !== 'undefined') {
            window.setTimeout(() => setToast((current) => (current === 'Loaded your current business details. Save to confirm any changes.' ? null : current)), 4000);
          }
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const enforcePlan = async () => {
      try {
        const tok = typeof window !== 'undefined' ? localStorage.getItem('idToken') : null;
        const headers: Record<string, string> = tok ? { Authorization: `Bearer ${tok}` } : {};
        let res = await fetch('/api/plan/status', { cache: 'no-store', credentials: 'include', headers });
        if (!res.ok) res = await fetch('/api/plan/status', { cache: 'no-store', headers });
        if (res.status === 401) {
          return;
        }
        if (!res.ok) return;
        const data = await res.json().catch(() => null) as { status?: string } | null;
        const normalized = (data?.status || '').toLowerCase();
        const allowed = normalized === 'starter' || normalized === 'active' || normalized === 'trialing';
        if (!cancelled) setPlanAllowed(allowed);
        if (!allowed && !cancelled) {
          setError('Choose a plan to keep building your workspace. Redirecting…');
          setTimeout(() => {
            const next = encodeURIComponent(window.location.pathname + window.location.search || '');
            window.location.replace(`/pricing?welcome=1&next=${next}`);
          }, 600);
        }
      } catch {}
    };
    void enforcePlan();
    return () => { cancelled = true; };
  }, []);

  // Premium gradient halo
  const Halo = () => (
    <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[700px] h-[220px] blur-2xl"
      style={{ background: 'radial-gradient(50% 60% at 50% 50%, rgba(99,102,241,.25), rgba(168,85,247,.15) 60%, transparent)' }} />
  );

  useEffect(() => {
    // soft geolocation to bias autocomplete
    try { navigator.geolocation.getCurrentPosition(p=>setCoords({ lat: p.coords.latitude, lng: p.coords.longitude })); } catch {}
  }, []);

  // Autocomplete with debounce
  useEffect(() => {
    if (!input.trim()) { setSuggestions([]); return; }
    setLoading(true); setError(null);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const body: Record<string, unknown> = {
          input,
          sessionToken,
          includedRegionCodes: region !== 'auto' ? region : undefined,
          lat: coords?.lat,
          lng: coords?.lng,
          language: (navigator.languages?.[0]||navigator.language||'').split('-')[0] || undefined,
        };
        const res = await fetch('/api/places/autocomplete', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body), signal: ctrl.signal });
        const data = await res.json();
        const items: Suggestion[] = (data.items || []).slice(0, 8);
        setSuggestions(items);
      } catch (e) {
        if (!(e instanceof DOMException && e.name==='AbortError')) setError('Autocomplete failed');
      } finally { setLoading(false); }
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [input, sessionToken, region, coords?.lat, coords?.lng]);

  async function getDetails(placeId: string): Promise<Details | null> {
    try {
      const url = `/api/places/details?placeId=${encodeURIComponent(placeId)}&sessionToken=${encodeURIComponent(sessionToken)}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) return null;
      const j = await r.json();
      return {
        id: j.id,
        displayName: j.displayName,
        formattedAddress: j.formattedAddress,
        rating: j.rating,
        userRatingCount: j.userRatingCount,
        googleMapsUri: j.googleMapsUri,
        writeAReviewUri: j.writeAReviewUri,
        lat: j.lat,
        lng: j.lng,
      };
    } catch { return null; }
  }

  const mapSrc = useMemo(() => {
    if (!selected?.lat || !selected?.lng) return null;
    const u = new URL('/api/maps/static', window.location.origin);
    u.searchParams.set('lat', String(selected.lat));
    u.searchParams.set('lng', String(selected.lng));
    u.searchParams.set('w', '720');
    u.searchParams.set('h', '200');
    u.searchParams.set('zoom', '15');
    return u.toString();
  }, [selected?.lat, selected?.lng]);

  const reviewUrl = selected?.writeAReviewUri || '';
  const qrReview = reviewUrl ? `/api/qr?data=${encodeURIComponent(reviewUrl)}&format=png&scale=8` : null;

  const resetCopyState = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopyState('idle');
      copyTimerRef.current = null;
    }, 2400);
  }, []);

  const handleCopyReview = useCallback(async () => {
    if (!reviewUrl) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(reviewUrl);
        setCopyState('copied');
        resetCopyState();
        return;
      }
      throw new Error('Clipboard unavailable');
    } catch {
      try {
        if (typeof document !== 'undefined') {
          const textarea = document.createElement('textarea');
          textarea.value = reviewUrl;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setCopyState('copied');
          resetCopyState();
          return;
        }
        throw new Error('Clipboard unavailable');
      } catch {
        setCopyState('error');
        resetCopyState();
      }
    }
  }, [reviewUrl, resetCopyState]);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  }, []);

  async function save() {
    if (!selected?.displayName) return;
    if (!planAllowed) {
      setError('Choose a plan to keep building your workspace. Redirecting…');
      setTimeout(() => window.location.replace('/pricing?welcome=1'), 400);
      return;
    }
    setSaving(true); setError(null);
    try {
      const tok = typeof window !== 'undefined' ? localStorage.getItem('idToken') : null;
      const headers: Record<string,string> = { 'Content-Type':'application/json' };
      if (tok) headers.Authorization = `Bearer ${tok}`;
      const payload = {
        name: selected.displayName,
        google_place_id: selected.id,
        google_maps_place_uri: selected.googleMapsUri || null,
        google_maps_write_review_uri: reviewUrl || null,
        review_link: reviewUrl || null,
        address: selected.formattedAddress || null,
        google_rating: typeof selected.rating === 'number' ? selected.rating : null,
        // Include idToken so the server can authenticate even if the cookie is missing
        idToken: tok || undefined,
      };
      // Attempt 1: JSON POST with cookie + bearer
      let ok = false;
      let lastErr = '';
      try {
        const r = await fetch('/api/businesses/upsert', { method:'POST', headers, credentials:'include', body: JSON.stringify(payload) });
        ok = r.ok;
        if (!ok) {
          const txt = await r.text().catch(()=>String(r.status));
          lastErr = txt || '';
          if (txt) console.warn('upsert json failed:', txt);
        }
      } catch (e) {
        console.warn('upsert json error', e);
      }
      // Attempt 2: form-encoded (server also accepts /form)
      if (!ok) {
        try {
          const form = new URLSearchParams();
          form.set('name', payload.name);
          if (payload.google_place_id) form.set('google_place_id', payload.google_place_id);
          if (payload.google_maps_place_uri) form.set('google_maps_place_uri', String(payload.google_maps_place_uri));
          if (payload.google_maps_write_review_uri) form.set('google_maps_write_review_uri', String(payload.google_maps_write_review_uri));
          if (payload.review_link) form.set('review_link', String(payload.review_link));
          if (payload.address) form.set('address', String(payload.address));
          if (typeof payload.google_rating === 'number') form.set('google_rating', String(payload.google_rating));
          if (tok) form.set('idToken', tok);
          const r2 = await fetch('/api/businesses/upsert/form', { method:'POST', body: form, credentials:'include' });
          ok = r2.ok;
          if (!ok) {
            const txt = await r2.text().catch(()=>String(r2.status));
            lastErr = txt || lastErr;
          }
        } catch (e) {
          console.warn('upsert form error', e);
        }
      }
      // Remove sendBeacon path to avoid silent failures
      if (!ok) throw new Error(lastErr || 'Save failed');
      setToast('Saved — redirecting to your dashboard…');
      setTimeout(()=>{ window.location.href = '/dashboard?from=onboarding'; }, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-white via-indigo-50 to-white py-10">
      <Halo />
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Connect your business</h1>
          <p className="mt-2 text-gray-600">Search your place via Google, preview the map, and we’ll generate your review link and QR instantly.</p>
        </div>

        {toast && <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 text-blue-800 p-3 shadow-sm">{toast}</div>}
        {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 p-3 shadow-sm">{error}</div>}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl ring-1 ring-black/5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-800">Search</label>
              <input ref={searchRef} value={input} onChange={e=>{ setInput(e.target.value); setSelected(null); }} placeholder="e.g., Smart Fit Miami" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="w-full sm:w-56">
              <label className="block text-sm font-medium text-gray-800">Region</label>
              <select value={region} onChange={e=>setRegion(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 bg-white">
                <option value="auto">Auto (IP/geo)</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="MX">Mexico</option>
                <option value="GB">United Kingdom</option>
                <option value="ES">Spain</option>
                <option value="BR">Brazil</option>
                <option value="AR">Argentina</option>
                <option value="CO">Colombia</option>
                <option value="FR">France</option>
                <option value="DE">Germany</option>
                <option value="PT">Portugal</option>
                <option value="JP">Japan</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>

          {Boolean(suggestions.length) && !selected && (
            <div className="mt-3 rounded-2xl border border-gray-100 bg-white shadow-lg divide-y">
              {suggestions.map(s => (
                <button key={s.placeId} type="button" onClick={async ()=>{ const d = await getDetails(s.placeId); if (d){ setSelected(d); setSessionToken(newSessionToken()); setSuggestions([]);} }} className="w-full text-left px-4 py-3 hover:bg-gray-50">
                  <div className="font-medium text-gray-900">{s.mainText}</div>
                  <div className="text-sm text-gray-600">{s.secondaryText}</div>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="mt-5 space-y-4">
              {mapSrc ? (
                <img src={mapSrc} alt="Map preview" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
              ) : (
                <div className="w-full h-48 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-500">Map unavailable</div>
              )}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                <div className="text-lg font-semibold text-gray-900">{selected.displayName}</div>
                <div className="text-sm text-gray-600">{selected.formattedAddress || 'Address unavailable'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 mb-1">Google review link</div>
                <div className="flex flex-wrap gap-2">
                  <input readOnly value={reviewUrl} className="flex-1 min-w-[220px] rounded-xl border border-gray-200 px-3 py-2" />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                      onClick={handleCopyReview}
                    >
                      {copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Copy failed' : 'Copy'}
                    </button>
                    <span
                      className={`text-xs ${copyState === 'copied' ? 'text-emerald-600' : copyState === 'error' ? 'text-rose-600' : 'text-gray-500'}`}
                      aria-live="polite"
                    >
                      {copyState === 'copied' ? 'Link copied to clipboard' : copyState === 'error' ? 'Unable to copy' : '\u00A0'}
                    </span>
                  </div>
                  {reviewUrl && (
                    <a
                      target="_blank"
                      rel="noopener"
                      referrerPolicy="no-referrer"
                      href={reviewUrl}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Open
                    </a>
                  )}
                </div>
                {qrReview && (
                  <div className="mt-3 flex items-center gap-4">
                    <Image src={qrReview} alt="QR to review link" width={120} height={120} className="h-28 w-28 rounded-xl border" unoptimized />
                    <a className="text-blue-600 underline" href={qrReview} download>Download QR (PNG)</a>
                  </div>
                )}
              </div>
              <div className="pt-2">
                <button onClick={save} disabled={saving} className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 shadow disabled:opacity-50">{saving ? 'Saving…' : 'Save and continue'}</button>
                <button onClick={()=>{ setSelected(null); setSessionToken(newSessionToken()); setTimeout(()=>searchRef.current?.focus(), 0); }} className="ml-3 px-4 py-3 rounded-xl border border-gray-200">Back to search</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
