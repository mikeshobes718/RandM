"use client";
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function FirebaseActionHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    // Get all the Firebase action parameters
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    const apiKey = searchParams.get('apiKey');
    const continueUrl = searchParams.get('continueUrl');
    const lang = searchParams.get('lang');

    // Build the redirect URL based on the action mode
    let redirectUrl = '/';

    if (mode === 'verifyEmail') {
      // Redirect to verify-email page with the verification code
      const params = new URLSearchParams();
      params.set('mode', mode);
      if (oobCode) params.set('oobCode', oobCode);
      if (apiKey) params.set('apiKey', apiKey);
      if (lang) params.set('lang', lang);
      redirectUrl = `/verify-email?${params.toString()}`;
    } else if (mode === 'resetPassword') {
      // Redirect to password reset page
      const params = new URLSearchParams();
      params.set('mode', mode);
      if (oobCode) params.set('oobCode', oobCode);
      if (apiKey) params.set('apiKey', apiKey);
      redirectUrl = `/reset-password?${params.toString()}`;
    } else if (mode === 'recoverEmail') {
      // Redirect to email recovery page
      const params = new URLSearchParams();
      params.set('mode', mode);
      if (oobCode) params.set('oobCode', oobCode);
      redirectUrl = `/recover-email?${params.toString()}`;
    } else if (continueUrl) {
      // Use the continue URL if provided
      try {
        const url = new URL(continueUrl);
        redirectUrl = url.pathname + url.search;
      } catch {
        redirectUrl = '/';
      }
    }

    // Redirect to the appropriate page
    window.location.href = redirectUrl;
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
        <p className="text-white text-lg">Redirecting...</p>
      </div>
    </div>
  );
}
