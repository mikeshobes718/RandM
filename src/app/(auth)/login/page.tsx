"use client";
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, confirmPasswordReset } from 'firebase/auth';
import { clientAuth } from '@/lib/firebaseClient';
import Link from 'next/link';

async function getPostLoginRedirect(): Promise<string> {
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    const signedOut = params.get('signed_out');
    
    if (mode === 'resetPassword' && oobCode) {
      setIsPasswordReset(true);
      setResetCode(oobCode);
    }
    
    if (signedOut) {
      try {
        localStorage.removeItem('idToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('selectedPlan');
        sessionStorage.clear();
      } catch {}
    }
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await confirmPasswordReset(clientAuth, resetCode, newPassword);
      setError('Password reset successful!');
      setIsPasswordReset(false);
    } catch (err: any) {
      setError('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setError('Please verify your email.');
        setLoading(false);
        localStorage.setItem('userEmail', email);
        setTimeout(() => window.location.href = '/verify-email', 2000);
        return;
      }

      const token = await user.getIdToken();
      localStorage.setItem('idToken', token);
      localStorage.setItem('userEmail', email);

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token, days: 7 }),
        credentials: 'include',
      });

      const redirectUrl = await getPostLoginRedirect();
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  const inputClass = "h-11 w-full rounded-lg border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-white";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block text-2xl font-black tracking-tighter text-brand mb-8">
            R&M
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {isPasswordReset ? 'Reset password' : 'Welcome back'}
          </h1>
        </div>

        <div className="premium-card p-8 rounded-3xl">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          {isPasswordReset ? (
            <form onSubmit={handlePasswordReset} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-brand transition-colors"
                  >
                    {showNewPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Confirm</label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="primary-button w-full h-11">
                {loading ? '...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Password</label>
                  <Link href="/forgot" className="text-[10px] font-bold text-brand hover:underline">Forgot?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-brand transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="primary-button w-full h-11">
                {loading ? '...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted">
            Don't have an account? <Link href="/register" className="text-brand font-bold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
