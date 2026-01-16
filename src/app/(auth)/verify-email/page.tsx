"use client";
import { useEffect, useState } from 'react';
import { clientAuth } from '@/lib/firebaseClient';
import { onAuthStateChanged, applyActionCode } from 'firebase/auth';
import Link from 'next/link';

async function getPostVerificationRedirect(): Promise<string> {
  try {
    // 1. Check if user has an active subscription
    const planRes = await fetch('/api/plan/status', { credentials: 'include' });
    if (!planRes.ok) {
      // If we can't check plan (e.g. 401), they MUST go to select-plan to be safe
      console.warn('[VERIFY] Plan check failed or unauthorized, redirecting to /select-plan');
      return '/select-plan';
    }
    
    const planData = await planRes.json();
    if (planData.status === 'none') {
      return '/select-plan';
    }

    // 2. Check if they already have a business setup
    const bizRes = await fetch('/api/businesses/me', { credentials: 'include' });
    if (bizRes.ok) {
      const bizData = await bizRes.json();
      if (bizData && bizData.business && bizData.business.google_place_id) {
        return '/dashboard';
      }
    }
    
    // If they have a plan but no business, go to onboarding
    return '/onboarding/business';
  } catch (error) {
    console.error('[VERIFY] Redirect check failed:', error);
    return '/select-plan';
  }
}

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [cooldown, setCooldown] = useState(0);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) setEmail(storedEmail);
    
    try {
      const storedLink = localStorage.getItem('pendingVerificationLink');
      if (storedLink) setVerificationLink(storedLink);
    } catch {}

    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          try { localStorage.removeItem('pendingVerificationLink'); } catch {}
          const redirectUrl = await getPostVerificationRedirect();
          window.location.replace(redirectUrl);
        } else {
          setMessage('📧 Verification email sent! Please check your inbox and spam folder.');
          setMessageType('info');
        }
      } else {
        // Not logged in and not verifying via oobCode
        const params = new URLSearchParams(window.location.search);
        if (!params.get('oobCode')) {
          window.location.replace('/login?redirect=/verify-email');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    const error = params.get('error');
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (verified === 'true') {
      setMessage('✅ Email verified! Redirecting...');
      setMessageType('success');
      getPostVerificationRedirect().then((url) => {
        setTimeout(() => { window.location.replace(url); }, 2000);
      });
    } else if (mode === 'verifyEmail' && oobCode) {
      handleVerificationCode(oobCode);
    } else if (error) {
      let errorMessage = 'Verification failed. Please try again.';
      if (error === 'expired') errorMessage = 'Verification link has expired.';
      else if (error === 'invalid') errorMessage = 'Invalid verification link.';
      setMessage(errorMessage);
      setMessageType('error');
    }
  }, []);

  const handleVerificationCode = async (code: string) => {
    if (verifying) return;
    setVerifying(true);
    setMessage('Verifying your email...');
    setMessageType('info');
    try {
      await applyActionCode(clientAuth, code);
      
      if (clientAuth.currentUser) {
        await clientAuth.currentUser.reload();
        const token = await clientAuth.currentUser.getIdToken(true);
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token, days: 7 }),
          credentials: 'include',
        });
        localStorage.setItem('idToken', token);
      }
      
      setMessage('✅ Email verified! Preparing your setup...');
      setMessageType('success');
      
      const url = await getPostVerificationRedirect();
      try { localStorage.removeItem('pendingVerificationLink'); } catch {}
      setTimeout(() => { window.location.replace(url); }, 2000);
    } catch (err: any) {
      console.error('[VERIFY] Error:', err);
      setMessage('Verification failed. The link may be expired or already used.');
      setMessageType('error');
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    const userEmail = email || clientAuth.currentUser?.email;
    if (!userEmail) {
      setMessage('Please sign in again to resend.');
      setMessageType('error');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, type: 'verify' }),
      });
      const result = await response.json();
      if (result?.link) {
        setVerificationLink(result.link);
        try { localStorage.setItem('pendingVerificationLink', result.link); } catch {}
      }
      if (!response.ok) throw new Error(result.error || 'Failed to send');
      setMessage('✅ Verification email sent! Please check your inbox.');
      setMessageType('success');
      setCooldown(60);
    } catch (err: any) {
      setMessage(`Failed: ${err.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!verificationLink) return;
    try {
      await navigator.clipboard.writeText(verificationLink);
      setCopyStatus('Copied!');
    } catch {
      setCopyStatus('Failed to copy.');
    }
    setTimeout(() => setCopyStatus(''), 2500);
  };

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-12 px-2">
          {[
            { label: 'Register', status: 'complete' },
            { label: 'Verify', status: 'active' },
            { label: 'Plan', status: 'pending' },
            { label: 'Setup', status: 'pending' }
          ].map((step, i) => (
            <div key={step.label} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                step.status === 'complete' ? 'bg-emerald-500 border-emerald-500 text-white' :
                step.status === 'active' ? 'bg-white border-brand text-brand shadow-lg shadow-brand/20' :
                'bg-white border-slate-200 text-slate-400'
              }`}>
                {step.status === 'complete' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : i + 1}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                step.status === 'active' ? 'text-brand' : 'text-slate-400'
              }`}>{step.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-10">
          <Link href="/" className="inline-block text-2xl font-black tracking-tighter text-brand mb-8">
            R&M
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
            {verifying ? 'Just a moment...' : 'Check your inbox'}
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            {email ? `We've sent a verification link to ${email}` : 'Verification link sent to your email'}
          </p>
        </div>

        <div className="premium-card p-10 rounded-[40px] shadow-2xl shadow-slate-200/60 relative overflow-hidden bg-white">
          {/* Animated background pulse */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
          
          {message && (
            <div className={`mb-8 p-4 rounded-2xl text-xs font-bold border-2 animate-in fade-in slide-in-from-top-2 ${
              messageType === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
              messageType === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
              'bg-brand/5 border-brand/10 text-brand'
            }`}>
              <div className="flex items-center gap-3">
                {messageType === 'success' && <span className="text-lg">🎉</span>}
                {messageType === 'error' && <span className="text-lg">⚠️</span>}
                {messageType === 'info' && <span className="text-lg">📧</span>}
                <span className="leading-relaxed">{message}</span>
              </div>
            </div>
          )}

          {/* HIDING FOR TESTING: 
          {verificationLink && (
            <div className="mb-8 p-6 rounded-3xl bg-amber-50/50 border border-amber-100 relative group">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-amber-100 rounded-full text-[9px] font-black text-amber-700 uppercase tracking-widest border border-amber-200">
                Backup Link Detected
              </div>
              <p className="text-[11px] text-amber-800 mb-4 leading-relaxed font-medium">
                If the email is taking too long, use this instant verification button:
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    try {
                      const url = new URL(verificationLink);
                      const oobCode = url.searchParams.get('oobCode');
                      if (oobCode) handleVerificationCode(oobCode);
                    } catch (e) {}
                  }}
                  disabled={verifying}
                  className="primary-button !bg-amber-600 !h-12 !text-xs w-full shadow-lg shadow-amber-200/50 active:scale-95 transition-transform"
                >
                  {verifying ? 'Verifying...' : 'Verify Instantly'}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:text-amber-800 transition-colors py-2"
                >
                  {copyStatus || 'Copy Link for Manual Entry'}
                </button>
              </div>
            </div>
          )}
          */}

          {!verifying && (
            <div className="space-y-4">
              <button
                onClick={async () => {
                  setLoading(true);
                  if (clientAuth.currentUser) {
                    await clientAuth.currentUser.reload();
                    if (clientAuth.currentUser.emailVerified) {
                      const url = await getPostVerificationRedirect();
                      window.location.replace(url);
                    } else {
                      setMessage('Verification not detected yet. Click the link in your email first.');
                      setMessageType('error');
                    }
                  }
                  setLoading(false);
                }}
                disabled={loading}
                className="primary-button w-full h-14 text-sm shadow-xl shadow-brand/20 active:scale-95 transition-transform"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                    Checking...
                  </div>
                ) : "I've clicked the link"}
              </button>

              <button
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                className="secondary-button w-full h-14 text-xs font-bold border-2 border-slate-100 hover:border-brand/20 transition-all active:scale-95"
              >
                {cooldown > 0 ? (
                  <span className="text-slate-400">Resend available in {cooldown}s</span>
                ) : (
                  'Resend verification email'
                )}
              </button>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Troubleshooting</h4>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Check Spam Folder', icon: '📥' },
                { label: 'Wait 2-3 minutes', icon: '⏳' },
                { label: 'Confirm email address', icon: '🔍' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                  <span className="text-sm">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Entered the wrong email? <Link href="/register" className="text-brand font-black hover:underline uppercase tracking-widest ml-1">Start Over</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
