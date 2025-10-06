"use client";
import { useEffect, useState } from 'react';
import { clientAuth } from '@/lib/firebaseClient';
import { onAuthStateChanged, sendEmailVerification, applyActionCode } from 'firebase/auth';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [cooldown, setCooldown] = useState(0);
  const [autoSent, setAutoSent] = useState(false);

  useEffect(() => {
    // Get stored email
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }

    // Check if user is already verified
    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          // User is verified, redirect to dashboard
          window.location.href = '/dashboard';
        } else {
          // Check if we should auto-send verification email
          const params = new URLSearchParams(window.location.search);
          const shouldAutoSend = params.get('autoSend') === '1';
          
          if (shouldAutoSend && !autoSent) {
            setAutoSent(true);
            // Auto-send verification email after a short delay
            setTimeout(() => {
              handleResend(true);
            }, 500);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [autoSent]);

  // Handle verification link from email
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      handleVerificationCode(oobCode);
    }
  }, []);

  const handleVerificationCode = async (code: string) => {
    setVerifying(true);
    setMessage('Verifying your email...');
    setMessageType('info');

    try {
      await applyActionCode(clientAuth, code);
      
      // Reload user to get updated emailVerified status
      if (clientAuth.currentUser) {
        await clientAuth.currentUser.reload();
      }

      setMessage('✅ Email verified successfully! Redirecting to dashboard...');
      setMessageType('success');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      console.error('Verification error:', err);
      
      if (err.code === 'auth/expired-action-code') {
        setMessage('Verification link has expired. Please request a new one below.');
      } else if (err.code === 'auth/invalid-action-code') {
        setMessage('Invalid verification link. Please request a new one below.');
      } else {
        setMessage('Failed to verify email. Please try again.');
      }
      setMessageType('error');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async (isAutoSend = false) => {
    if (cooldown > 0 || loading) return;

    if (!clientAuth.currentUser) {
      setMessage('Please sign in again to resend verification email');
      setMessageType('error');
      return;
    }

    setLoading(true);
    if (!isAutoSend) {
      setMessage('');
    }

    try {
      // Try sending via Firebase
      await sendEmailVerification(clientAuth.currentUser, {
        url: `${window.location.origin}/verify-email`,
      });

      setMessage(isAutoSend ? 'Verification email sent! Please check your inbox.' : 'Verification email sent! Please check your inbox.');
      setMessageType('success');
      
      // Set cooldown
      setCooldown(60);
    } catch (err: any) {
      console.error('Resend error:', err);
      
      // More specific error handling
      if (err.code === 'auth/too-many-requests') {
        setMessage('Too many requests. Please wait a few minutes before trying again.');
      } else if (err.code === 'auth/user-token-expired') {
        setMessage('Your session expired. Please sign in again.');
      } else {
        setMessage('Failed to send verification email. Please try clicking "Resend" again.');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!clientAuth.currentUser) {
      setMessage('Please sign in again');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('Checking verification status...');
    setMessageType('info');

    try {
      await clientAuth.currentUser.reload();
      
      if (clientAuth.currentUser.emailVerified) {
        setMessage('✅ Email verified! Redirecting...');
        setMessageType('success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setMessage('Email not verified yet. Please check your inbox and click the verification link.');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Failed to check verification status. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h16a2 2 0 012 2l-10 6L2 6zm20 2.24l-10 6-10-6V18a2 2 0 002 2h16a2 2 0 002-2V8.24z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {verifying ? 'Verifying...' : 'Verify your email'}
            </h1>
            <p className="text-slate-600">
              {email ? `We sent a verification link to ${email}` : 'Check your inbox for a verification link'}
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl ${
              messageType === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
              messageType === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
              'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          {/* Actions */}
          {!verifying && (
            <div className="space-y-3">
              <button
                onClick={handleCheckVerification}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {loading ? 'Checking...' : "I've verified my email"}
              </button>

              <button
                onClick={() => handleResend(false)}
                disabled={loading || cooldown > 0}
                className="w-full py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : loading ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Wrong email?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                Create a new account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
