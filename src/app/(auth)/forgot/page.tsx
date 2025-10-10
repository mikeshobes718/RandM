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
        // For security, show success even on some errors
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
      setCopyStatus('Reset link copied to your clipboard.');
    } catch {
      setCopyStatus('Unable to copy automatically. You can select and copy the link above.');
    }
    setTimeout(() => setCopyStatus(''), 2500);
  };

  const handleOpenLink = () => {
    if (!resetLink) return;
    try {
      window.open(resetLink, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = resetLink;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 1.586l-4 4v3.414l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a2 2 0 002 2h4a2 2 0 002-2V4a1 1 0 00-.293-.707l-6-6a1 1 0 00-1.414 0zM17 6a1 1 0 011-1h2a1 1 0 011 1v7h-4V6zm-1 7h-.5a2.5 2.5 0 000 5H16v1a1 1 0 11-2 0v-1h-.5a4.5 4.5 0 110-9H14v-1a1 1 0 112 0v1h.5a2.5 2.5 0 010 5H16v7a3 3 0 11-6 0v-7h-.5a4.5 4.5 0 010-9H10V6a3 3 0 016 0v1h.5a4.5 4.5 0 110 9H16v-3z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset your password</h1>
            <p className="text-slate-600">We'll send you a link to reset your password</p>
          </div>

          {/* Success Message */}
          {success ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Check your email</p>
                    <p className="text-sm text-green-700 mt-1">
                      If an account exists for {email}, you'll receive a password reset link shortly.
                    </p>
                  </div>
                </div>
                {resetLink && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-white p-3 text-sm text-green-700">
                    <p className="font-semibold mb-2">Need it right away?</p>
                    <p className="mb-3">Use the button below to open your reset link instantly.</p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {resetLink && (
                        <a
                          href={resetLink}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center justify-center rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-600 transition"
                        >
                          Open reset link
                        </a>
                      )}
                      <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center justify-center rounded-lg border border-green-300 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 transition"
                      >
                        Copy link
                      </button>
                    </div>
                    {copyStatus && <p className="mt-2 text-xs text-green-600">{copyStatus}</p>}
                  </div>
                )}
              </div>

              <Link
                href="/login"
                className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-center"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
