"use client";
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { clientAuth } from '@/lib/firebaseClient';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email');
      return;
    }
    setLoading(true);
    try {
      let delivered = false;
      try {
        const r = await fetch('/api/auth/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed, type: 'reset' }),
        });
        if (!r.ok) throw new Error(await r.text().catch(() => 'Failed to queue email'));
        delivered = true;
      } catch (postmarkErr) {
        try {
          await sendPasswordResetEmail(clientAuth, trimmed);
          delivered = true;
        } catch (firebaseErr) {
          const message = firebaseErr instanceof Error ? firebaseErr.message : String(firebaseErr);
          throw new Error(postmarkErr instanceof Error ? `${postmarkErr.message}. ${message}` : message);
        }
      }
      if (delivered) {
        setSent(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-sm shadow-xl p-6">
          <div className="mb-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-3">
              <svg aria-hidden className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z"/></svg>
            </div>
            <h1 className="text-2xl font-bold">Reset your password</h1>
            <p className="text-sm text-gray-600">We’ll send you a secure link</p>
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input aria-label="Email" className="mt-1 w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} onBlur={()=>{ if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setError('Enter a valid email'); else setError(null); }} required />
            </label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 font-medium shadow hover:from-blue-700 hover:to-purple-700 transition">{loading?'Sending…':'Send reset link'}</button>
            {error && <div role="alert" className="text-red-600 text-sm">{error}</div>}
            {sent && <div className="text-green-700 text-sm">Check your email for a reset link.</div>}
          </form>
          <div className="mt-4 text-sm text-center">
            <a className="text-gray-600 hover:text-gray-900" href="/login">Back to sign in</a>
          </div>
        </div>
      </div>
    </main>
  );
}
