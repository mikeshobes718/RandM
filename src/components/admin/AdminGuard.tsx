"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

const HARDCODED_ADMINS = ["mikeshobes718@yahoo.com", "volurer295@ovbest.com"];
const ENV_ADMINS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAILS = Array.from(new Set([...HARDCODED_ADMINS, ...ENV_ADMINS]));

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log('[AdminGuard] Checking authorization...');
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          console.error('[AdminGuard] Auth check failed:', res.status);
          router.push('/login?redirect=/admin');
          return;
        }
        const user = await res.json();
        console.log('[AdminGuard] User logged in as:', user?.email);
        
        const userEmail = user?.email?.toLowerCase();
        if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
          console.log('[AdminGuard] Authorized access for:', userEmail);
          setAuthorized(true);
        } else {
          console.warn('[AdminGuard] Unauthorized access attempt:', userEmail);
          router.push('/');
        }
      } catch (err) {
        console.error('[AdminGuard] Unexpected error:', err);
        router.push('/login?redirect=/admin');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8">
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]"></div>
        <h2 className="text-xl font-black uppercase tracking-[0.3em] animate-pulse">Authenticating Admin</h2>
        <p className="text-slate-500 font-bold mt-2 text-sm">Verifying clearance for Mike's Panel...</p>
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
