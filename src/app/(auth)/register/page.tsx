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
      
      // Crucial: Set the session cookie immediately
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

      // Smooth transition to verification
      window.location.replace('/verify-email');
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
      setLoading(false);
    }
  };

  const inputClass = "h-12 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all bg-white shadow-sm";

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-sm px-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-12 px-2 max-w-md mx-auto">
          {[
            { label: 'Register', status: 'active' },
            { label: 'Verify', status: 'pending' },
            { label: 'Plan', status: 'pending' },
            { label: 'Setup', status: 'pending' }
          ].map((step, i) => (
            <div key={step.label} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                step.status === 'active' ? 'bg-white border-brand text-brand shadow-lg shadow-brand/20' :
                'bg-white border-slate-200 text-slate-400'
              }`}>
                {i + 1}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                step.status === 'active' ? 'text-brand' : 'text-slate-400'
              }`}>{step.label}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-10">
          <Link href="/" className="inline-block text-3xl font-black tracking-tighter text-brand mb-8 hover:opacity-80 transition-opacity">
            R&M
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Start Your 5-Star Journey</h1>
          <p className="text-slate-500 font-medium mt-2">Create your account in seconds.</p>
        </div>

        <div className="premium-card p-10 rounded-[40px] shadow-2xl shadow-slate-200/60 bg-white max-w-md mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -ml-16 -mt-16"></div>
          
          {error && (
            <div className="mb-8 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-xs text-red-600 font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Acme Coffee"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address <span className="text-red-500">*</span></label>
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Phone <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(formatPhoneNumber(e.target.value))}
                className={inputClass}
                placeholder="(555) 000-0000"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="primary-button w-full h-14 text-sm shadow-xl shadow-brand/20 active:scale-95 transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                  Creating Account...
                </div>
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Already have an account? <Link href="/login" className="text-brand font-black hover:underline uppercase tracking-widest ml-1">Sign In</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
