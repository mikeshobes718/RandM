"use client";
import { useEffect, useMemo, useState } from 'react';

export default function PostCheckout() {
  const [status, setStatus] = useState<'idle'|'linking'|'need-auth'|'done'|'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const params = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
  const sessionIdQ = params.get('session_id') || '';
  const [sidPrefill, setSidPrefill] = useState<string>('');

  useEffect(() => {
    // Precompute values used in both linking and login fallback
    let sid = sessionIdQ;
    try {
      if (!sid) sid = localStorage.getItem('stripe:lastSessionId') || '';
    } catch {}
    setSidPrefill(sid || '');

    async function link() {
      if (!sid) {
        // Fallback: ask server to claim the latest subscription for this signed-in email
        try {
          const tok = (() => { try { return localStorage.getItem('idToken'); } catch { return null; } })();
          const headers: Record<string,string> = { 'Content-Type': 'application/json' };
          if (tok) headers.Authorization = `Bearer ${tok}`;
          const res2 = await fetch('/api/stripe/claim/latest', {
            method: 'POST', headers, credentials: 'include', body: JSON.stringify({ idToken: tok || undefined })
          });
          if (res2.ok) {
            setStatus('done'); setMessage('All set! Redirecting to your dashboard…');
            setTimeout(() => { window.location.href = '/dashboard?welcome=1'; }, 900);
            return;
          }
        } catch {}
        setStatus('error'); setMessage('Missing session id.'); return;
      }
      setStatus('linking'); setMessage('Finalizing your upgrade…');
      try {
        // Ensure server has a valid session cookie; proactively sync if we only have a client idToken
        try {
          const tok = localStorage.getItem('idToken');
          if (tok) {
            await fetch('/api/auth/session', { method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'include', body: JSON.stringify({ idToken: tok, days: 7 }) });
          }
        } catch {}
        const tok = (() => { try { return localStorage.getItem('idToken'); } catch { return null; } })();
        const headers: Record<string,string> = { 'Content-Type': 'application/json' };
        if (tok) headers.Authorization = `Bearer ${tok}`;
        const res = await fetch('/api/stripe/claim', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ session_id: sid, idToken: tok || undefined }),
        });
        if (res.status === 401) { setStatus('need-auth'); setMessage('Please sign in to finish.'); return; }
        if (!res.ok) throw new Error(await res.text().catch(()=>String(res.status)));
        try { localStorage.removeItem('stripe:lastSessionId'); } catch {}
        setStatus('done'); setMessage('All set! Redirecting to your dashboard…');
        setTimeout(() => { window.location.href = '/dashboard?welcome=1'; }, 900);
      } catch (e) {
        setStatus('error'); setMessage(e instanceof Error ? e.message : 'Linking failed');
      }
    }
    link();
  }, [sessionIdQ]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-white">
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-3">Thanks for upgrading</h1>
        <p className="text-gray-600 mb-6">{message || 'Processing…'}</p>
        {status === 'need-auth' && (
          <div className="space-x-3">
            <a href={`/login?next=${encodeURIComponent(`/post-checkout${sidPrefill?`?session_id=${encodeURIComponent(sidPrefill)}`:''}`)}`} className="inline-block px-4 py-2 rounded-xl bg-gray-900 text-white">Sign in</a>
            <a href={`/register?next=${encodeURIComponent(`/post-checkout${sidPrefill?`?session_id=${encodeURIComponent(sidPrefill)}`:''}`)}`} className="inline-block px-4 py-2 rounded-xl border">Create account</a>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 text-sm text-gray-500">You can also head to <a className="underline" href="/pricing">pricing</a> and try again.</div>
        )}
      </div>
    </main>
  );
}
