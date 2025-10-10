"use client";
import { useEffect, useState } from 'react';
import { clientAuth } from '@/lib/firebaseClient';
import { onAuthStateChanged, applyActionCode } from 'firebase/auth';
import Link from 'next/link';

/**
 * Check if user needs plan selection or can go to dashboard
 * New users should go to plan selection first, then onboarding
 */
async function getPostVerificationRedirect(): Promise<string> {
  try {
    // Check if user has a business record (completed onboarding)
    const response = await fetch('/api/businesses/me', {
      credentials: 'include',
    });

    console.log('[ONBOARDING CHECK] API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[ONBOARDING CHECK] Business data:', {
        hasBusiness: !!data?.business,
        businessId: data?.business?.id,
        businessName: data?.business?.name
      });
      
      // API returns { business: {...} } or { business: null }
      // Existing users with business records go to dashboard
      if (data && data.business && data.business.id) {
        console.log('[ONBOARDING CHECK] ✅ Has business, going to dashboard');
        return '/dashboard';
      }
      
      console.log('[ONBOARDING CHECK] ❌ No business, going to plan selection');
    } else {
      console.log('[ONBOARDING CHECK] ❌ API failed or no business, going to plan selection');
    }

    // No business found, need plan selection first
    return '/select-plan';
  } catch (error) {
    console.error('[ONBOARDING CHECK] Error:', error);
    // Default to plan selection if we can't determine
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
  const [autoSent, setAutoSent] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>('');

  useEffect(() => {
    // Get stored email
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
    try {
      const storedLink = localStorage.getItem('pendingVerificationLink');
      if (storedLink) {
        setVerificationLink(storedLink);
      }
    } catch {}

    // Check if user is already verified
    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          try { localStorage.removeItem('pendingVerificationLink'); } catch {}
          // User is verified, check if they need onboarding
          const redirectUrl = await getPostVerificationRedirect();
          window.location.href = redirectUrl;
        } else {
          // Email was already sent during registration via server-side API
          // No need to auto-send again
          setMessage('📧 Verification email sent! Please check your inbox and spam folder.');
          setMessageType('success');
        }
      }
    });

    return () => unsubscribe();
  }, [autoSent]);

  // Handle verification link from email
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    const error = params.get('error');
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (verified === 'true') {
      setMessage('✅ Email verified successfully! Redirecting...');
      setMessageType('success');
      
      // Check if user needs onboarding or can go to dashboard
      getPostVerificationRedirect().then((redirectUrl) => {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);
      });
    } else if (mode === 'verifyEmail' && oobCode) {
      // Handle verification code from custom verification handler
      handleVerificationCode(oobCode);
    } else if (error) {
      let errorMessage = 'Verification failed. Please try again.';
      if (error === 'expired') {
        errorMessage = 'Verification link has expired. Please request a new one below.';
      } else if (error === 'invalid') {
        errorMessage = 'Invalid verification link. Please request a new one below.';
      } else if (error === 'invalid-link') {
        errorMessage = 'Invalid verification link format. Please request a new one below.';
      } else if (error === 'invalid-mode') {
        errorMessage = 'Invalid verification mode. Please request a new one below.';
      } else if (error === 'verification-failed') {
        errorMessage = 'Email verification failed. Please request a new one below.';
      }
      
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
      
      // Reload user to get updated emailVerified status
      if (clientAuth.currentUser) {
        await clientAuth.currentUser.reload();
      }

      setMessage('✅ Email verified successfully! Redirecting...');
      setMessageType('success');

      // Check if user needs onboarding or can go to dashboard
      const redirectUrl = await getPostVerificationRedirect();
      try { localStorage.removeItem('pendingVerificationLink'); } catch {}
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1500);
    } catch (err: any) {
      console.error('Verification error:', err);
      
      if (err.code === 'auth/expired-action-code') {
        setMessage('Verification link has expired. Please request a new one below.');
      } else if (err.code === 'auth/invalid-action-code') {
        setMessage('Invalid verification link. Please request a new one below.');
      } else {
        setMessage('Failed to verify email. Please try again.');
      }
      setMessageType('error');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async (isAutoSend = false) => {
    if (cooldown > 0 || loading) return;

    const userEmail = email || clientAuth.currentUser?.email;
    if (!userEmail) {
      setMessage('Please sign in again to resend verification email');
      setMessageType('error');
      return;
    }

    setLoading(true);
    if (!isAutoSend) {
      setMessage('Sending verification email...');
      setMessageType('info');
    }

    try {
      // Use Postmark-based email API instead of Firebase
      const response = await fetch('/api/auth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          type: 'verify'
        }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (result?.link) {
        setVerificationLink(result.link);
        try { localStorage.setItem('pendingVerificationLink', result.link); } catch {}
      }

      if (!response.ok) {
        const errorText = (result && typeof result.error === 'string') ? result.error : 'Failed to send verification email';
        
        // Handle rate limiting specifically
        if (response.status === 429 || errorText.includes('Too many verification attempts')) {
          throw new Error(`Too many attempts. Please wait 5 minutes before trying again.`);
        }
        
        throw new Error(errorText);
      }

      console.log('Email sent successfully:', result);

      setMessage(isAutoSend ? '📧 Verification email sent! Please check your inbox and spam folder.' : '✅ Verification email sent! Please check your inbox and spam folder.');
      setMessageType('success');
      
      // Set cooldown
      setCooldown(60);
    } catch (err: any) {
      console.error('Resend error:', err);
      
      let errorMessage = err.message;
      
      // Handle rate limiting with better user messaging
      if (err.message.includes('Rate limited') || err.message.includes('Too many attempts')) {
        errorMessage = 'Too many verification attempts. Please wait 5 minutes before trying again.';
        setCooldown(300); // 5 minutes
      } else if (err.message.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
        errorMessage = 'Too many verification attempts. Please wait 5 minutes before trying again.';
        setCooldown(300); // 5 minutes
      }
      
      setMessage(`Failed to send verification email: ${errorMessage}. Please try again or contact support.`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!clientAuth.currentUser) {
      setMessage('Please sign in again');
      setMessageType('error');
      return;
    }

    setLoading(true);
      setMessage('Checking verification status...');
      setMessageType('info');

    try {
      await clientAuth.currentUser.reload();
      
      if (clientAuth.currentUser.emailVerified) {
        setMessage('✅ Email verified! Redirecting...');
        setMessageType('success');
        try { localStorage.removeItem('pendingVerificationLink'); } catch {}
        
        // Check if user needs onboarding or can go to dashboard
        const redirectUrl = await getPostVerificationRedirect();
        
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
      } else {
        setMessage('Email not verified yet. Please check your inbox (and spam folder) and click the verification link.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Failed to check verification status. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = () => {
    if (!verificationLink) return;
    try {
      window.open(verificationLink, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = verificationLink;
    }
  };

  const handleCopyLink = async () => {
    if (!verificationLink) return;
    try {
      await navigator.clipboard.writeText(verificationLink);
      setCopyStatus('Copied!');
    } catch {
      setCopyStatus('Unable to copy automatically. You can select and copy the link above.');
    }
    setTimeout(() => setCopyStatus(''), 2500);
  };

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2l-10 6L2 6zm20 2.24l-10 6-10-6V18a2 2 0 002 2h16a2 2 0 002-2V8.24z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {verifying ? 'Verifying...' : 'Verify your email'}
            </h1>
            <p className="text-slate-600">
              {email ? `We sent a verification link to ${email}` : 'Check your inbox for a verification link'}
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl ${
              messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
              messageType === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
              'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          {verificationLink && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold mb-2">Still missing the email?</p>
              <p className="mb-3">You can verify instantly with the secure link below.</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={handleOpenLink}
                  className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 transition"
                >
                  Open verification link
                </button>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition"
                >
                  Copy link
                </button>
              </div>
              {copyStatus && <p className="mt-2 text-xs text-amber-600">{copyStatus}</p>}
            </div>
          )}

          {/* Actions */}
          {!verifying && (
            <div className="space-y-3">
              <button
                onClick={handleCheckVerification}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {loading ? 'Checking...' : "I've verified my email"}
              </button>

              <button
                onClick={() => handleResend(false)}
                disabled={loading || cooldown > 0}
                className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : loading ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-700 mb-2">
              <strong>📬 Didn't receive the email?</strong>
            </p>
            <ul className="text-xs text-blue-600 space-y-1 pl-4 list-disc">
              <li>Check your spam/junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>Wait a minute and click "Resend" if needed</li>
              <li>Contact support if issues persist</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Wrong email?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Create a new account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
