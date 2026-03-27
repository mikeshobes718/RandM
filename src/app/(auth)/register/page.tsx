"use client";
import { useState } from 'react';
import { clientAuth } from '@/lib/firebaseClient';
import Link from 'next/link';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!businessPhone.trim()) { setError('Business phone is required'); setLoading(false); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return; }

    try {
      const registrationResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, displayName: businessName.trim() }),
      });
      if (!registrationResponse.ok) {
        const errorText = await registrationResponse.text();
        throw new Error(errorText || 'Registration failed');
      }
      const registrationData = await registrationResponse.json();
      const { customToken, verificationLink } = registrationData;
      const { signInWithCustomToken } = await import('firebase/auth');
      const userCredential = await signInWithCustomToken(clientAuth, customToken);
      const user = userCredential.user;
      const token = await user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token, days: 7 }),
        credentials: 'include',
      });
      localStorage.setItem('pendingBusinessName', businessName.trim());
      localStorage.setItem('pendingBusinessPhone', businessPhone.replace(/\D/g, '') || '');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('idToken', token);
      if (verificationLink) localStorage.setItem('pendingVerificationLink', verificationLink);
      window.location.replace('/verify-email');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account.');
      setLoading(false);
    }
  };

  const inputCls = "h-12 min-h-[48px] w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all touch-pan-y";

  const steps = [
    { label: 'Register', active: true },
    { label: 'Verify', active: false },
    { label: 'Plan', active: false },
    { label: 'Setup', active: false },
  ];

  return (
    <main className="min-h-[100dvh] bg-surface flex flex-col items-center justify-start sm:justify-center py-10 sm:py-12 px-6 touch-pan-y">
      <div className="w-full max-w-md">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-10 px-4">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step.active
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'bg-surface-container text-on-surface-variant/60'
              }`}>
                {i + 1}
              </div>
              <span className={`text-[9px] font-semibold uppercase tracking-widest ${
                step.active ? 'text-primary' : 'text-on-surface-variant/50'
              }`}>{step.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg primary-gradient">
              <span className="text-base font-extrabold text-on-primary">R</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Start Your 5-Star Journey</h1>
          <p className="text-on-surface-variant text-sm mt-2">Create your account in seconds.</p>
        </div>

        <div className="surface-card p-8">
          {error && (
            <div className="mb-6 p-3 bg-error-container/30 rounded-lg text-xs text-on-error-container font-medium flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-on-surface-variant">Business Name <span className="text-error">*</span></label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} placeholder="e.g. Acme Coffee" required />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-on-surface-variant">Email Address <span className="text-error">*</span></label>
              <input type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="name@company.com" required />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-on-surface-variant">Password <span className="text-error">*</span></label>
              <div className="relative isolate">
                <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pr-12`} required minLength={8} placeholder="Min. 8 characters" />
                <button type="button" tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-md p-2 text-on-surface-variant/60 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-on-surface-variant">Business Phone <span className="text-error">*</span></label>
              <input type="tel" value={businessPhone} onChange={(e) => setBusinessPhone(formatPhoneNumber(e.target.value))} className={inputCls} placeholder="(555) 000-0000" required />
            </div>

            <button type="submit" disabled={loading} className="primary-button w-full h-12 text-sm font-semibold">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  Creating Account...
                </div>
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-on-surface-variant">
            Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
