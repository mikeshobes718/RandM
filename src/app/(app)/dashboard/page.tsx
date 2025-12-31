"use client";
import BusinessSetupForm from "@/components/onboarding/BusinessSetupForm";
import ProAnalytics from "@/components/dashboard/ProAnalytics";
import MultipleQrManager from "@/components/dashboard/MultipleQrManager";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { formatPhone } from '@/lib/phone';

type Business = {
  id: string | null;
  name: string;
  review_link?: string | null;
  google_maps_write_review_uri?: string | null;
  contact_phone?: string | null;
  google_rating?: number | null;
  google_place_id?: string | null;
};

type Stats = {
  reviewsThisMonth: number;
  shareLinkScans: number;
  averageRating: number | null;
};

type Analytics = {
  history: { date: string; reviews: number; scans: number }[];
  sentiment: { positive: number; neutral: number; negative: number };
  ratingDistribution?: Record<number, number>;
  funnel?: { scans: number; selections: number; completions: number };
  sources?: Record<string, number>;
  growth?: number;
};

type FeedbackItem = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  comment: string | null;
  rating: number;
  marketing_consent: boolean | null;
  created_at: string;
  type: 'feedback' | 'contact' | 'google' | 'event';
};

type ActivityItem = {
  event: string;
  time: string;
  icon: string;
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [stats, setStats] = useState<Stats>({ reviewsThisMonth: 0, shareLinkScans: 0, averageRating: null });
  const [recentFeedback, setRecentFeedback] = useState<FeedbackItem[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const isFromEdit = searchParams?.get('from') === 'edit';

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const tok = localStorage.getItem('idToken');
        const headers: Record<string, string> = tok ? { Authorization: `Bearer ${tok}` } : {};
        
        const res = await fetch(`/api/dashboard/summary?t=${Date.now()}`, { cache: 'no-store', credentials: 'include', headers });
        if (!res.ok) throw new Error('Failed to load dashboard data');
        
        const data = await res.json();
        setBusiness(data.business);
        setStats(data.stats ?? { reviewsThisMonth: 0, shareLinkScans: 0, averageRating: null });
        setRecentFeedback(data.recentFeedback ?? []);
        setActivityFeed(data.activityFeed ?? []);
        setIsPro(data.isPro ?? false);
        setAnalytics(data.analytics ?? null);
        
        // Onboarding redirect logic
        if (data.business && !data.business.google_place_id && !isFromEdit) {
          window.location.href = '/onboarding/business';
          return;
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const landingUrl = useMemo(() => {
    if (!business?.id) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.reviewsandmarketing.com';
    return `${origin}/r/${business.id}`;
  }, [business?.id]);

  const handleCopyLink = () => {
    if (!landingUrl) return;
    navigator.clipboard.writeText(landingUrl);
    setCopyState('copied');
    setTimeout(() => setCopyState('idle'), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full mb-4"></div>
        <p className="text-muted text-sm font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <div className="premium-card p-10 rounded-3xl text-center">
          <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Welcome! Let's get started.</h1>
          <p className="text-muted mb-8 text-balance text-sm leading-relaxed">
            Connect your business to start collecting 5-star Google reviews and private feedback from your customers.
          </p>
          <BusinessSetupForm />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected to {business.name}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">System Normal</span>
          </div>
          <Link href="/onboarding/business?edit=1" className="secondary-button text-sm !h-10">
            Edit Business
          </Link>
          <Link href="/settings" className="secondary-button text-sm !h-10">
            Settings
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="premium-card p-6 rounded-2xl">
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Google Rating</div>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-black">
              {stats.averageRating !== null && stats.averageRating !== undefined ? 
                stats.averageRating.toFixed(1) : 
                <span className="text-2xl text-muted">N/A</span>
              }
            </div>
            <div className="flex mb-1.5">
              {stats.averageRating !== null && stats.averageRating !== undefined ? (
                [1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className={`w-4 h-4 ${s <= (stats.averageRating ?? 0) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                  </svg>
                ))
              ) : (
                <span className="text-[10px] text-muted font-medium">No reviews yet</span>
              )}
            </div>
          </div>
        </div>
        <div className="premium-card p-6 rounded-2xl">
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Reviews This Month</div>
          <div className="text-4xl font-black">{stats.reviewsThisMonth}</div>
        </div>
                <div className="premium-card p-6 rounded-2xl">
                  <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Link Scans This Month</div>
                  <div className="text-4xl font-black">{stats.shareLinkScans}</div>
                </div>
      </div>

      {/* Advanced Analytics for Pro Users */}
      {isPro && analytics ? (
        <ProAnalytics data={analytics} />
      ) : !isPro && (
        <div className="mt-12 premium-card p-10 rounded-3xl bg-brand/5 border-dashed flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Unlock Advanced Analytics</h2>
            <p className="text-sm text-muted mb-8 max-w-md">Get daily performance tracking, sentiment analysis, and customer behavior insights by upgrading to Pro.</p>
            <Link href="/pricing" className="primary-button h-11 px-8">
                Upgrade to Pro
            </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
        {/* Main Toolkit Card */}
        <div className="lg:col-span-7 space-y-8">
          <section className="premium-card p-8 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            
            <h2 className="text-xl font-bold mb-6">Review Toolkit</h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider block mb-3">Your Landing Link</label>
                <div className="flex gap-2">
                  <div className="flex-1 h-11 bg-accent rounded-lg border border-border px-4 flex items-center text-sm font-mono truncate">
                    {landingUrl}
                  </div>
                  <button onClick={handleCopyLink} className="secondary-button !h-11 px-6 text-sm">
                    {copyState === 'copied' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 items-start pt-4 border-t border-border">
                <div className="bg-white p-3 border border-border rounded-xl shadow-sm shrink-0">
                  <img
                    src={`/api/qr?data=${encodeURIComponent(landingUrl || '')}&format=png&scale=8`}
                    alt="QR Code"
                    className="w-32 h-32"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Smart QR Code</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Display this QR code at your checkout or tables. Happy customers are routed to Google, while others provide private feedback.
                  </p>
                  <a
                    href={`/api/qr?data=${encodeURIComponent(landingUrl || '')}&format=png&scale=8`}
                    download
                    className="text-brand text-sm font-bold hover:underline inline-flex items-center gap-2"
                  >
                    Download PNG
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Multiple QR Codes for Pro Users */}
          {isPro && business?.id && landingUrl && (
            <MultipleQrManager businessId={business.id} landingUrl={landingUrl} />
          )}

          {/* Recent Activity for Pro Users */}
          {isPro && (
            <section className="premium-card p-8 rounded-3xl bg-accent/30 border-dashed">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Recent Activity</h2>
                <span className="text-[10px] font-bold text-brand bg-brand/5 px-2 py-1 rounded">Pro</span>
              </div>
              <div className="space-y-4">
                {activityFeed.length === 0 ? (
                  <p className="text-xs text-muted text-center py-4">No recent activity detected.</p>
                ) : (
                  activityFeed.map((act, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-base">{act.icon}</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 capitalize">{act.event}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Integrations Teaser */}
          <section className="premium-card p-8 rounded-3xl bg-accent/30 border-dashed">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Square Integration</h2>
              {isPro ? (
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Connected</span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand bg-brand/5 px-2 py-1 rounded">Pro Feature</span>
              )}
            </div>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              Automatically send review requests to your Square customers after they finish their purchase.
            </p>
            <Link href="/integrations/square" className="text-sm font-bold text-brand hover:underline">
              {isPro ? 'Manage Connection' : 'Upgrade to Connect Square'} →
            </Link>
          </section>
        </div>

        {/* Feedback Sidebar */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 space-y-6">
            <section className="premium-card p-6 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Recent Feedback</h2>
                <Link href="/feedback" className="text-xs font-bold text-brand hover:underline">View All</Link>
              </div>

              {recentFeedback.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-border rounded-2xl">
                  <p className="text-xs text-muted">No feedback yet. Share your link to start collecting responses.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentFeedback.map((item: any) => {
                    const isEvent = item.type === 'event';
                    return (
                      <div key={item.id} className="p-4 bg-accent/30 rounded-xl border border-border/50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">{isEvent ? 'Verified Redirect' : (item.name || 'Anonymous')}</span>
                            {!isEvent && (
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                item.rating >= 4 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {item.rating}★
                              </span>
                            )}
                            {isEvent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase tracking-tighter">
                                Redirect
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-xs line-clamp-2 leading-relaxed italic ${isEvent ? 'text-slate-400' : 'text-muted'}`}>
                          {isEvent ? 'Customer routed to Google profile' : `"${item.comment || 'No comment provided'}"`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            
            {/* Helpful Tip */}
            <div className="p-6 bg-brand/5 rounded-3xl border border-brand/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand mb-2">Pro Tip</h4>
              <p className="text-xs text-brand/80 leading-relaxed">
                Add your review QR code to your printed receipts or table tents to increase scan rates by up to 40%.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
