'use client';

import { useState, FormEvent } from 'react';

interface NewsletterSignupProps {
  variant?: 'inline' | 'modal' | 'footer';
  onSuccess?: () => void;
}

export default function NewsletterSignup({ variant = 'inline', onSuccess }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing!');
        setEmail('');
        
        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setStatus('error');
        setMessage(errorData.message || 'Failed to subscribe.');
      }
    } catch (error) {
      console.error('Newsletter signup error:', error);
      setStatus('error');
      setMessage('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-11 w-full rounded-lg border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-white";
  const buttonClass = "primary-button h-11 px-6 text-sm whitespace-nowrap disabled:opacity-50";

  if (variant === 'inline') {
    return (
      <div className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className={inputClass}
            disabled={loading}
            aria-label="Email address"
          />
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? '...' : 'Subscribe'}
          </button>
        </form>
        {status !== 'idle' && (
          <p className={`mt-3 text-sm text-center ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className={inputClass + " h-9 text-xs px-3"}
            disabled={loading}
            aria-label="Email address"
          />
          <button type="submit" disabled={loading} className={buttonClass + " h-9 px-3 text-xs"}>
            {loading ? '...' : 'Join'}
          </button>
        </div>
        {status !== 'idle' && (
          <p className={`text-[10px] ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
        <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
        </svg>
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">Get exclusive tips</h3>
        <p className="text-sm text-muted">Strategies to grow your Google reviews, delivered monthly.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={inputClass}
          disabled={loading}
          aria-label="Email address"
        />
        <button type="submit" disabled={loading} className={buttonClass + " w-full"}>
          {loading ? 'Subscribing...' : 'Join 500+ Owners'}
        </button>
        {status !== 'idle' && (
          <p className={`text-sm ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
