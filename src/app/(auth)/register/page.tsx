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

    if (!businessPhone.trim()) {
      setError('Business phone is required');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const registrationResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          displayName: businessName.trim(),
        }),
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
      
      if (verificationLink) {
        localStorage.setItem('pendingVerificationLink', verificationLink);
      }

      window.location.href = '/verify-email';
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
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
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        </div>

        <div className="premium-card p-8 rounded-3xl">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass}
                placeholder="Acme Dental"
                required
              />
            </div>
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
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  required
                  minLength={8}
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
              <PasswordStrengthMeter password={password} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Business Phone <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(formatPhoneNumber(e.target.value))}
                className={inputClass}
                placeholder="(555) 000-0000"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="primary-button w-full h-11">
              {loading ? '...' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted">
            Already have an account? <Link href="/login" className="text-brand font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
