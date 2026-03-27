"use client";
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, confirmPasswordReset } from 'firebase/auth';
import { clientAuth } from '@/lib/firebaseClient';
import { resolveRoute } from '@/lib/resolveRoute';
import Link from 'next/link';

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
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
    try {
      await confirmPasswordReset(clientAuth, resetCode, newPassword);
      setError('Password reset successful!');
      setIsPasswordReset(false);
    } catch { setError('Failed to reset password.'); }
    finally { setLoading(false); }
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
      const redirectUrl = await resolveRoute(token);
      window.location.href = redirectUrl;
    } catch {
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  const inputCls = "h-12 w-full min-h-[48px] rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all touch-pan-y";

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-start sm:justify-center py-10 sm:py-12 px-6 touch-pan-y bg-surface">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg primary-gradient">
              <span className="text-base font-extrabold text-on-primary">R</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {isPasswordReset ? 'Reset password' : 'Welcome back'}
          </h1>
        </div>

        <div className="surface-card p-8">
          {error && (
            <div className={`mb-6 p-3 rounded-lg text-xs font-medium ${error.includes('successful') ? 'bg-secondary-container/30 text-on-secondary-container' : 'bg-error-container/30 text-on-error-container'}`}>
              {error}
            </div>
          )}

          {isPasswordReset ? (
            <form onSubmit={handlePasswordReset} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-on-surface-variant">New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} required minLength={6} />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showNewPassword ? 'visibility' : 'visibility_off'}</span>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-on-surface-variant">Confirm</label>
                <input type={showNewPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} required />
              </div>
              <button type="submit" disabled={loading} className="primary-button w-full h-11 text-sm font-semibold">
                {loading ? '...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-on-surface-variant">Email</label>
                <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="name@company.com" required />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[11px] font-semibold text-on-surface-variant">Password</label>
                  <Link href="/forgot" className="text-[11px] font-semibold text-primary hover:underline">Forgot?</Link>
                </div>
                <div className="relative isolate">
                  <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pr-12`} required />
                  <button type="button" tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-md p-2 text-on-surface-variant/60 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPassword ? 'visibility' : 'visibility_off'}</span>
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="primary-button w-full h-11 text-sm font-semibold">
                {loading ? '...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-on-surface-variant">
            Don&apos;t have an account? <Link href="/register" className="text-primary font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
