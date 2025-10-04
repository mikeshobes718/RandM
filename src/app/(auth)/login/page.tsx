"use client";
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { clientAuth } from '@/lib/firebaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      // simple client validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError('Enter a valid email');
        return;
      } else { setEmailError(null); }
      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      } else { setPasswordError(null); }
      const cred = await signInWithEmailAndPassword(clientAuth, email, password);
      const token = await cred.user.getIdToken();
      try { localStorage.setItem('idToken', token); localStorage.setItem('userEmail', email); window.dispatchEvent(new Event('idtoken:changed')); } catch {}
      // Try to establish HttpOnly session cookie, but don't hang UI if it stalls
      // Establish HttpOnly session cookie and wait until server confirms it
      await fetch('/api/auth/session', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ idToken: token, days: 7 }),
        credentials: 'include',
      }).catch(()=>undefined);
      // Fallback: also set a non-HttpOnly cookie so server can verify raw idToken if session creation fails
      try {
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        const maxAge = 7 * 24 * 60 * 60; // 7 days
        const host = window.location.hostname;
        const domain = host.includes('.') ? `; Domain=.${host.replace(/^www\./,'')}` : '';
        document.cookie = `idToken=${token}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}${domain}`;
      } catch {}
      // Poll /api/auth/me to ensure the cookie is actually usable by the server
      try {
        for (let i=0;i<6;i++) {
          const r = await fetch('/api/auth/me', { cache:'no-store', credentials:'include' }).catch(()=>null);
          if (r && r.ok) break;
          await new Promise(res=>setTimeout(res, 400));
        }
      } catch {}
      try { window.dispatchEvent(new Event('idtoken:changed')); } catch {}
      // Decide destination: if not verified, go to verify-email; else based on business
      let target = '/onboarding/business';
      try {
        await cred.user.reload();
        if (!cred.user.emailVerified) {
          // ensure a verification email is available to resend
          try { localStorage.setItem('userEmail', email); } catch {}
          setError('Please verify your email first. Redirecting to verification page...');
          setTimeout(() => {
            window.location.href = '/verify-email';
          }, 1500);
          return;
        }
      } catch {}
      try {
        const headers: Record<string,string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        let r = await fetch('/api/businesses/me', { cache:'no-store', credentials:'include', headers });
        if (!r.ok) r = await fetch('/api/businesses/me', { cache:'no-store', headers });
        if (r.ok) {
          const j = await r.json();
          if (j && j.business) target = '/dashboard';
        }
      } catch {}
      // Respect an explicit next param only if it is NOT the onboarding page when a business exists
      try {
        const u = new URL(window.location.href);
        const nextParam = u.searchParams.get('next');
        const isOnboarding = (p: string) => p === '/onboarding' || p.startsWith('/onboarding/');
        if (nextParam && target === '/dashboard' && !isOnboarding(nextParam)) target = nextParam;
      } catch {}
      window.location.href = target;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally { setLoading(false); }
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-12 overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float-blob" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float-blob" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="max-w-md mx-auto px-4">
        <div className="relative rounded-3xl border border-white/10 bg-white/95 backdrop-blur-xl shadow-2xl p-8 glow-soft">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/60 via-white/40 to-transparent pointer-events-none" />
          
          <div className="relative mb-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/50 glow-soft">
              <svg aria-hidden className="w-8 h-8 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">Welcome back</h1>
            <p className="text-sm text-slate-600 mt-2">Sign in to access your dashboard</p>
          </div>
          <form onSubmit={submit} className="relative space-y-5" noValidate>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input aria-label="Email" className="mt-2 w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onBlur={()=>{ if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setEmailError('Enter a valid email'); else setEmailError(null); }} required />
              {emailError && <div role="alert" className="text-red-600 text-xs mt-1 font-medium">{emailError}</div>}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <div className="mt-2 relative">
                <input aria-label="Password" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50" type={show?'text':'password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onBlur={()=>{ if (password.length<6) setPasswordError('Password must be at least 6 characters'); else setPasswordError(null); }} required />
                <button type="button" aria-label={show? 'Hide password':'Show password'} onClick={()=>setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <svg aria-hidden className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0Z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/></svg>
                </button>
              </div>
              {passwordError && <div role="alert" className="text-red-600 text-xs mt-1 font-medium">{passwordError}</div>}
            </label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-3.5 font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">{loading?'Signing in…':'Sign in'}</button>
            {error && <div role="alert" className={error.includes('verify') ? 'text-orange-600 text-sm font-medium bg-orange-50 p-3 rounded-lg' : 'text-red-600 text-sm bg-red-50 p-3 rounded-lg font-medium'}>{error}</div>}
          </form>
          <div className="mt-4 text-sm flex items-center justify-between">
            <a className="underline text-blue-600" href="/forgot">Forgot password?</a>
            <a className="text-gray-600 hover:text-gray-900" href="/register">Create account</a>
          </div>
        </div>
      </div>
    </main>
  );
}
