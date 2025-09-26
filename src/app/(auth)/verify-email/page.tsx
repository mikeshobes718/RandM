"use client";
import { useEffect, useState } from 'react';
import { clientAuth } from '@/lib/firebaseClient';
import { onAuthStateChanged, applyActionCode } from 'firebase/auth';

async function fetchPlanStatus(token?: string): Promise<string> {
  try {
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    let res = await fetch('/api/plan/status', { cache: 'no-store', credentials: 'include', headers });
    if (!res.ok) res = await fetch('/api/plan/status', { cache: 'no-store', headers });
    if (!res.ok) {
      const ent = await fetch('/api/entitlements', { cache: 'no-store', credentials: 'include', headers }).catch(() => null);
      if (ent && ent.ok) {
        const payload = await ent.json().catch(() => null) as { pro?: boolean } | null;
        return payload?.pro ? 'active' : 'none';
      }
      return 'unknown';
    }
    const data = await res.json().catch(() => null) as { status?: string } | null;
    return typeof data?.status === 'string' ? data.status : 'none';
  } catch {
    return 'unknown';
  }
}

function hasPaidPlan(status: string | null | undefined): boolean {
  const normalized = (status || '').toLowerCase();
  return normalized === 'starter' || normalized === 'active' || normalized === 'trialing';
}

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<'idle'|'sent'|'verified'|'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    try { setEmail(localStorage.getItem('userEmail') || ''); } catch {}
    const unsub = onAuthStateChanged(clientAuth, () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = (params.get('mode') || '').toLowerCase();
      const oob = params.get('oobCode');
      if (mode === 'verifyemail' && oob) {
        (async () => {
          try {
            setStatus('sent');
            setMessage('Completing verification…');
            await applyActionCode(clientAuth, oob);
            try { await clientAuth.currentUser?.reload(); } catch {}
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('mode');
              url.searchParams.delete('oobCode');
              url.searchParams.delete('apiKey');
              url.searchParams.delete('lang');
              const cleaned = url.searchParams.toString();
              window.history.replaceState({}, '', cleaned ? `${url.pathname}?${cleaned}` : url.pathname);
            } catch {}
            await check(true);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setStatus('error');
            setMessage(msg.includes('expired') ? 'Verification link expired. Click resend to get a new one.' : 'Verification link invalid. Please sign in again and resend.');
          }
        })();
      }
    } catch {}
  }, []);

  async function resend() {
    if (cooldown>0) return;
    try {
      // resend quota client-side: 3 per hour
      const now = Date.now();
      const start = Number(localStorage.getItem('verifyCountStart') || '0');
      const count = Number(localStorage.getItem('verifyCount') || '0');
      const windowMs = 60*60*1000;
      if (start && now - start < windowMs && count >= 3) {
        setStatus('error'); setMessage('Too many verification emails sent. Try again later.'); return;
      }
      const targetEmail = (localStorage.getItem('userEmail') || '').trim();
      if (!targetEmail) { setStatus('error'); setMessage('Please sign in again to resend verification.'); return; }
      const r = await fetch('/api/auth/email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: targetEmail, type: 'verify' }) });
      if (!r.ok) {
        // Fallback via Firebase client SDK
        if (!clientAuth.currentUser) throw new Error(await r.text().catch(()=>String(r.status)));
        await import('firebase/auth').then(({ sendEmailVerification }) => sendEmailVerification(clientAuth.currentUser!, { url: `${window.location.origin}/verify-email` }));
      }
      setStatus('sent');
      setMessage('Verification email sent. Please check your inbox.');
      // update quota and cooldown
      if (!start || now - start > windowMs) {
        localStorage.setItem('verifyCountStart', String(now));
        localStorage.setItem('verifyCount', '1');
      } else {
        localStorage.setItem('verifyCount', String(count+1));
      }
      setCooldown(30);
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Failed to send verification email');
    }
  }

  async function check(skipMessageReset?: boolean) {
    try {
      if (clientAuth.currentUser) {
        await clientAuth.currentUser.reload();
        if (clientAuth.currentUser.emailVerified) {
          setStatus('verified');
          setMessage('Email verified! Redirecting…');
          const token = await clientAuth.currentUser.getIdToken(true);
          await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token, days: 7 }) });
          try { window.dispatchEvent(new Event('idtoken:changed')); } catch {}
          const planStatus = await fetchPlanStatus(token);
          if (!hasPaidPlan(planStatus)) {
            setTimeout(() => { window.location.href = '/pricing?welcome=1'; }, 800);
            return;
          }
          // Decide destination based on whether a business exists
          let target = '/onboarding/business';
          try {
            const headers: Record<string,string> = { Authorization: `Bearer ${token}` };
            let r = await fetch('/api/businesses/me', { cache:'no-store', credentials:'include', headers });
            if (!r.ok) r = await fetch('/api/businesses/me', { cache:'no-store', headers });
            if (r.ok) {
              const j = await r.json();
              if (j && j.business) target = '/dashboard';
            }
          } catch {}
          // Avoid being forced back to onboarding via next param if business exists
          try {
            if (target === '/dashboard') {
              const href = new URL(window.location.href);
              const nextParam = href.searchParams.get('next');
              const isOnboarding = (p: string) => p === '/onboarding' || p.startsWith('/onboarding/');
              if (nextParam && !isOnboarding(nextParam)) {
                target = nextParam;
              }
            }
          } catch {}
          setTimeout(() => { window.location.href = target; }, 800);
          return;
        }
        if (!skipMessageReset) {
          setStatus('idle');
          setMessage('Not verified yet. Click “I verified” after confirming your email.');
        }
        return;
      }
      // If no Firebase user found, but we have a token, keep the session and stay here
      const idToken = localStorage.getItem('idToken');
      if (idToken) {
        await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, days: 7 }) });
        try { window.dispatchEvent(new Event('idtoken:changed')); } catch {}
        const planStatus = await fetchPlanStatus(idToken);
        if (!hasPaidPlan(planStatus)) {
          window.location.replace('/pricing?welcome=1');
          return;
        }
        setStatus('idle');
        setMessage('We reconnected your session. Please check your inbox and click “I verified”.');
        return;
      }
      setStatus('error');
      setMessage('Please sign in again.');
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Failed to verify');
    }
  }

  // Avoid auto-resend; Safari may restore user asynchronously
  useEffect(() => { if (cooldown<=0) return; const t=setTimeout(()=>setCooldown(s=>Math.max(0,s-1)),1000); return ()=>clearTimeout(t); }, [cooldown]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-sm shadow-xl p-6">
          <div className="text-center mb-4">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-3">
              <svg aria-hidden className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M2 6a2 2 0 012-2h16a2 2 0 012 2l-10 6L2 6Zm20 2.24-10 6-10-6V18a2 2 0 002 2h16a2 2 0 002-2V8.24Z"/></svg>
            </div>
            <h1 className="text-2xl font-bold">Verify your email</h1>
            <p className="text-sm text-gray-600">We sent a verification link to {email || 'your email'}.</p>
          </div>
          {message && (
            <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${status==='error' ? 'bg-red-50 text-red-700 border border-red-200' : status==='verified' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>{message}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { void check(); }}
              className="group flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 font-semibold shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[.99] transition flex items-center justify-center gap-2"
            >
              <svg aria-hidden className="w-5 h-5 opacity-90 group-hover:opacity-100" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>
              <span>I verified</span>
            </button>
            <button onClick={resend} disabled={cooldown>0} className="px-4 rounded-xl border border-gray-300 text-gray-800 disabled:opacity-50 hover:bg-gray-50">{cooldown>0?`Resend in ${cooldown}s`:'Resend'}</button>
          </div>
        </div>
      </div>
    </main>
  );
}
