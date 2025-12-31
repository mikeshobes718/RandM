"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);
    setResetLink(null);
    setCopyStatus('');

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      // Use custom Postmark-based email API instead of Firebase
      const response = await fetch('/api/auth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          type: 'reset'
        }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (result?.link) {
        setResetLink(result.link);
      }

      if (!response.ok) {
        // Still show success for security (don't reveal if email exists)
        const errorText = typeof result?.error === 'string' ? result.error : '';
        if (errorText.includes('user-not-found') || errorText.includes('not found')) {
          setSuccess(true);
        } else {
          throw new Error(errorText || 'Failed to send reset email');
        }
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.message && err.message.includes('too-many-requests')) {
        setError('Too many requests. Please try again later.');
      } else if (err.message && err.message.includes('invalid-email')) {
        setError('Please enter a valid email address');
      } else {
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopyStatus('Reset link copied!');
    } catch {
      setCopyStatus('Unable to copy.');
    }
    setTimeout(() => setCopyStatus(''), 2500);
  };

  const inputClass = "h-11 w-full rounded-lg border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-white";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block text-2xl font-black tracking-tighter text-brand mb-8">
            R&M
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        </div>

        <div className="premium-card p-8 rounded-3xl">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Check your email</p>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      If an account exists, you'll receive a password reset link shortly.
                    </p>
                  </div>
                </div>
                
                {resetLink && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-3">Development Link</p>
                    <div className="flex flex-col gap-2">
                      <a
                        href={resetLink}
                        className="primary-button !bg-emerald-600 !h-9 !text-xs w-full"
                      >
                        Open Reset Link
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
              </div>

              <Link
                href="/login"
                className="primary-button w-full h-11"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="name@company.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="primary-button w-full h-11"
              >
                {loading ? '...' : 'Send Reset Link'}
              </button>

              <div className="pt-4 text-center">
                <Link href="/login" className="text-xs font-bold text-brand hover:underline">
                  Remember password? Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
