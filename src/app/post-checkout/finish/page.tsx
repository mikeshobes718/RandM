"use client";
import { useEffect, useState } from 'react';

export default function Finish() {
  const [msg, setMsg] = useState('Finalizing your upgrade…');
  useEffect(() => {
    (async () => {
      try {
        const tok = localStorage.getItem('idToken');
        if (tok) {
          await fetch('/api/auth/session', { method: 'POST', headers:{'Content-Type':'application/json'}, credentials: 'include', body: JSON.stringify({ idToken: tok, days: 7 }) });
        }
      } catch {}
      try {
        const tok = localStorage.getItem('idToken') || '';
        const headers: Record<string,string> = tok ? { Authorization: `Bearer ${tok}`, 'Content-Type':'application/json' } : { 'Content-Type':'application/json' };
        const email = localStorage.getItem('userEmail') || '';
        const res = await fetch('/api/stripe/claim/latest', { method: 'POST', credentials: 'include', headers, body: JSON.stringify({ mode: 'test', idToken: tok || undefined, email }) });
        if (!res.ok) throw new Error(await res.text().catch(()=>String(res.status)));
        setMsg('All set! Redirecting to your dashboard…');
        setTimeout(()=>{ window.location.href = '/dashboard?welcome=1'; }, 900);
      } catch (e) {
        setMsg('We could not finish automatically. Please open Pricing and click Upgrade once more.');
      }
    })();
  }, []);
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-indigo-50 to-white">
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-3">Thanks for upgrading</h1>
        <p className="text-gray-600">{msg}</p>
      </div>
    </main>
  );
}
