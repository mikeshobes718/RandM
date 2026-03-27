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
      const response = await fetch('/api/auth/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), type: 'reset' }),
      });

      let result: any = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (result?.link) setResetLink(result.link);

      if (!response.ok) {
        const errorText = result?.error || 'Failed to send';
        if (errorText.includes('user-not-found')) {
          setSuccess(true); // Don't reveal if email exists
        } else {
          throw new Error(errorText);
        }
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setSuccess(true); // Always show success for security
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-11 w-full rounded-lg border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-primary transition-all bg-surface";

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block text-2xl font-black tracking-tighter text-brand mb-8">
            R&M
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="text-xs text-muted mt-2">We'll send you a secure link to reset your access.</p>
        </div>

        <div className="surface-card p-8 rounded-3xl">
          {error && !success && (
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
                    <p className="text-sm font-bold text-emerald-900">Email sent</p>
                    <p className="text-[10px] text-emerald-700 mt-1 leading-relaxed">
                      If an account exists, you'll receive a reset link shortly. Check your spam if it doesn't arrive.
                    </p>
                  </div>
                </div>
                
                {resetLink && (
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-3">Development Link</p>
                    <a href={resetLink} className="primary-button !bg-emerald-600 !h-9 !text-xs w-full">Open Reset Link</a>
                  </div>
                )}
              </div>

              <Link href="/login" className="primary-button w-full h-11">
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

              <button type="submit" disabled={loading} className="primary-button w-full h-11">
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
