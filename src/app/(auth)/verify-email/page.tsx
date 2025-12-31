"use client";
import { useEffect, useState } from 'react';
import { clientAuth } from '@/lib/firebaseClient';
import { onAuthStateChanged, applyActionCode } from 'firebase/auth';
import Link from 'next/link';

async function getPostVerificationRedirect(): Promise<string> {
  try {
    const response = await fetch('/api/businesses/me', {
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      if (data && data.business && data.business.id) {
        return '/dashboard';
      }
    }
    return '/select-plan';
  } catch (error) {
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
          window.location.href = redirectUrl;
        } else {
          setMessage('📧 Verification email sent! Please check your inbox and spam folder.');
          setMessageType('success');
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
      setMessage('✅ Email verified successfully! Redirecting...');
      setMessageType('success');
      getPostVerificationRedirect().then((url) => {
        setTimeout(() => { window.location.href = url; }, 1500);
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
    setVerifying(true);
    setMessage('Verifying your email...');
    setMessageType('info');
    try {
      await applyActionCode(clientAuth, code);
      if (clientAuth.currentUser) await clientAuth.currentUser.reload();
      setMessage('✅ Email verified successfully! Redirecting...');
      setMessageType('success');
      const url = await getPostVerificationRedirect();
      try { localStorage.removeItem('pendingVerificationLink'); } catch {}
      setTimeout(() => { window.location.href = url; }, 1500);
    } catch (err: any) {
      setMessage('Failed to verify email. Link may be expired.');
      setMessageType('error');
    } finally {
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

  const inputClass = "h-11 w-full rounded-lg border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-white";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block text-2xl font-black tracking-tighter text-brand mb-8">
            R&M
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {verifying ? 'Verifying...' : 'Verify your email'}
          </h1>
          <p className="text-xs text-muted mt-2">
            {email ? `Sent to ${email}` : 'Check your inbox for a link'}
          </p>
        </div>

        <div className="premium-card p-8 rounded-3xl">
          {message && (
            <div className={`mb-6 p-3 rounded-lg text-xs font-medium border ${
              messageType === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
              messageType === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
              'bg-brand/5 border-brand/10 text-brand'
            }`}>
              {message}
            </div>
          )}

          {verificationLink && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-bold text-amber-900 uppercase tracking-widest mb-3">Development Link</p>
              <div className="flex flex-col gap-2">
                <a
                  href={verificationLink}
                  className="primary-button !bg-amber-600 !h-9 !text-xs w-full"
                >
                  Verify Instantly
                </a>
                <button
                  onClick={handleCopyLink}
                  className="secondary-button !h-9 !text-xs w-full"
                >
                  {copyStatus || 'Copy Link'}
                </button>
              </div>
            </div>
          )}

          {!verifying && (
            <div className="space-y-4">
              <button
                onClick={async () => {
                  setLoading(true);
                  if (clientAuth.currentUser) {
                    await clientAuth.currentUser.reload();
                    if (clientAuth.currentUser.emailVerified) {
                      window.location.href = await getPostVerificationRedirect();
                    } else {
                      setMessage('Email not verified yet. Please check your inbox.');
                      setMessageType('error');
                    }
                  }
                  setLoading(false);
                }}
                disabled={loading}
                className="primary-button w-full h-11"
              >
                {loading ? '...' : "I've verified my email"}
              </button>

              <button
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                className="secondary-button w-full h-11 text-xs"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Troubleshooting</h4>
            <ul className="text-[10px] text-muted space-y-2 leading-relaxed">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted/40" />
                Check your spam or junk folder
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted/40" />
                Make sure the email is correct
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted/40" />
                Wait a few minutes before resending
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/register" className="text-xs text-brand font-bold hover:underline">
            Wrong email? Create a new account
          </Link>
        </div>
      </div>
    </main>
  );
}
