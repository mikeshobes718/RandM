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
        if (onSuccess) setTimeout(onSuccess, 2000);
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

  const inputBase = "h-11 w-full rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
  const buttonBase = "primary-button h-11 px-6 text-sm whitespace-nowrap disabled:opacity-50";

  if (variant === 'inline') {
    return (
      <div className="w-full max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className={inputBase}
            disabled={loading}
            aria-label="Email address"
          />
          <button type="submit" disabled={loading} className={buttonBase}>
            {loading ? '...' : 'Subscribe'}
          </button>
        </form>
        {status !== 'idle' && (
          <p className={`mt-3 text-sm text-center ${status === 'success' ? 'text-secondary' : 'text-error'}`}>
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
            className={inputBase + " h-9 text-xs px-3"}
            disabled={loading}
            aria-label="Email address"
          />
          <button type="submit" disabled={loading} className={buttonBase + " h-9 px-3 text-xs"}>
            {loading ? '...' : 'Join'}
          </button>
        </div>
        {status !== 'idle' && (
          <p className={`text-[10px] ${status === 'success' ? 'text-secondary' : 'text-error'}`}>
            {message}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>mail</span>
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">Get exclusive tips</h3>
        <p className="text-sm text-on-surface-variant">Strategies to grow your Google reviews, delivered monthly.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={inputBase}
          disabled={loading}
          aria-label="Email address"
        />
        <button type="submit" disabled={loading} className={buttonBase + " w-full"}>
          {loading ? 'Subscribing...' : 'Join 500+ Owners'}
        </button>
        {status !== 'idle' && (
          <p className={`text-sm ${status === 'success' ? 'text-secondary' : 'text-error'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
