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
  google_photo_url?: string | null;
  address?: string | null;
  business_type?: string | null;
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
  const [squareStatus, setSquareStatus] = useState<{ connected: boolean; isEnabled?: boolean; lastBackfillAt?: string | null } | null>(null);
  const [planStatus, setPlanStatus] = useState<string>('none');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

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
        setPlanStatus(data.planStatus ?? 'none');
        setAnalytics(data.analytics ?? null);
        setSquareStatus(data.squareConnection ?? null);
        
        // Onboarding redirect logic
        // 1. If no active plan, must pick one
        if (data.planStatus === 'none') {
          window.location.replace('/select-plan');
          return;
        }

        // 2. If no business OR business exists but Google not connected, go to setup
        if (!data.business || (!data.business.google_place_id && !isFromEdit)) {
          window.location.replace('/onboarding/business');
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Failed to load dashboard</h2>
        <p className="text-muted text-sm max-w-xs mb-8">{error}</p>
        <button onClick={() => window.location.reload()} className="primary-button !h-11 px-8">
          Try again
        </button>
      </div>
    );
  }

  if (!business || !business.id) {
    return null; // The useEffect will handle redirecting to /onboarding/business
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
          {business.google_photo_url && (
            <div 
              onClick={() => setIsPhotoModalOpen(true)}
              className="hidden sm:block w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-2xl flex-shrink-0 group relative cursor-pointer"
            >
              <img src={business.google_photo_url} alt={business.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
              {business.business_type && (
                <span className="bg-brand/5 text-brand text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border border-brand/10">
                  {business.business_type}
                </span>
              )}
            </div>
            <p className="text-muted text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Connected to {business.name}
              {business.address && (
                <span className="text-slate-400 font-normal border-l border-[#e2e8f0] pl-2 ml-1">
                  {business.address.split(',')[0]}
                </span>
              )}
            </p>
          </div>
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
        <div className="premium-card p-6 rounded-2xl group relative">
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
          {/* Tooltip */}
          <div className="absolute inset-x-0 -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2">
            <div className="bg-slate-900 text-white text-[10px] py-2 px-3 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest leading-tight">
              Your live public rating pulled directly from Google Maps.
            </div>
          </div>
        </div>
        <div className="premium-card p-6 rounded-2xl group relative">
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">New Google Reviews</div>
          <div className="text-4xl font-black">{stats.reviewsThisMonth}</div>
          {/* Tooltip */}
          <div className="absolute inset-x-0 -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2">
            <div className="bg-slate-900 text-white text-[10px] py-2 px-3 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest leading-tight">
              Number of customers successfully routed to your Google profile this month.
            </div>
          </div>
        </div>
        <div className="premium-card p-6 rounded-2xl group relative">
          <div className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Link Scans This Month</div>
          <div className="text-4xl font-black">{stats.shareLinkScans}</div>
          {/* Tooltip */}
          <div className="absolute inset-x-0 -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2">
            <div className="bg-slate-900 text-white text-[10px] py-2 px-3 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest leading-tight">
              Total times your landing page has been opened via QR code or direct link this month.
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics & Insights Section */}
      <div className="mt-12 relative">
        {!isPro && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-white/40 backdrop-blur-[6px] rounded-[40px] border-2 border-dashed border-brand/20">
            <div className="w-20 h-20 bg-brand text-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-brand/40 animate-bounce">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Unlock Your Business Intelligence</h2>
            <p className="text-slate-600 max-w-md mb-8 font-medium leading-relaxed">
              You're currently seeing <strong>less than 20%</strong> of your available data. Upgrade to Unlimited to track daily trends, see where every lead comes from, and analyze customer sentiment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link href="/pricing" className="primary-button h-14 px-10 text-lg shadow-xl shadow-brand/20">
                🚀 Upgrade Now
              </Link>
              <div className="text-[10px] font-black text-brand uppercase tracking-widest bg-brand/5 px-3 py-1.5 rounded-full border border-brand/10">
                Join 500+ Top Rated Businesses
              </div>
            </div>
          </div>
        )}

        {/* This renders real data for Pro, or dummy "blurred" layout for Free users */}
        <div className={!isPro ? "opacity-40 grayscale pointer-events-none select-none" : ""}>
          <ProAnalytics data={analytics || {
            history: Array.from({ length: 30 }, (_, i) => ({ 
              date: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
              reviews: Math.floor(Math.random() * 10) + 2,
              scans: Math.floor(Math.random() * 30) + 10
            })),
            sentiment: { positive: 85, neutral: 10, negative: 5 },
            ratingDistribution: { 1: 2, 2: 3, 3: 5, 4: 15, 5: 75 },
            funnel: { scans: 450, selections: 320, completions: 180 },
            sources: { "Main QR": 120, "Receipt": 45, "Instagram": 15 },
            growth: 24
          }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
        {/* Main Toolkit Card */}
        <div className="lg:col-span-7 space-y-8">
          <section className="premium-card p-8 rounded-3xl overflow-hidden relative group">
            <h2 className="text-xl font-bold mb-2">Review Toolkit</h2>
            <p className="text-sm text-muted mb-8 font-medium">Your core tools for collecting customer reviews.</p>
            
            <div className="space-y-8">
              <div className="relative group/copy">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Your Smart Landing Link</label>
                <div className="flex gap-2 p-1 bg-slate-50 border border-[#e2e8f0] rounded-2xl">
                  <div className="flex-1 h-11 bg-white rounded-xl px-4 flex items-center text-sm font-mono truncate text-slate-600 border border-[#f1f5f9] shadow-sm">
                    {landingUrl}
                  </div>
                  <button onClick={handleCopyLink} className={`primary-button !h-11 px-8 text-xs font-black uppercase tracking-widest transition-all ${copyState === 'copied' ? '!bg-emerald-500 !shadow-emerald-100' : ''}`}>
                    {copyState === 'copied' ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        Copied
                      </span>
                    ) : 'Copy Link'}
                  </button>
                </div>
                <div className="absolute inset-x-0 -top-10 opacity-0 group-hover/copy:opacity-100 transition-opacity pointer-events-none z-20 px-2">
                  <div className="bg-slate-900 text-white text-[9px] py-1.5 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest leading-tight">
                    The smart link that filters reviews before they reach Google.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-8 border-t border-[#e2e8f0]/50">
                <div className="md:col-span-4 flex flex-col items-center gap-4">
                  <div className="bg-white p-4 border-4 border-slate-50 rounded-[32px] shadow-2xl shadow-slate-200/50 group-hover:scale-[1.02] transition-transform">
                    <img
                      src={`/api/qr?data=${encodeURIComponent(landingUrl || '')}&format=png&scale=8`}
                      alt="QR Code"
                      className="w-full aspect-square max-w-[160px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <a
                      href={`/api/qr?data=${encodeURIComponent(landingUrl || '')}&format=png&scale=12`}
                      download={`${business.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`}
                      className="secondary-button !h-10 text-[10px] font-black uppercase tracking-widest bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PNG
                    </a>
                    <button 
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          const qrUrl = `/api/qr?data=${encodeURIComponent(landingUrl || '')}&format=png&scale=12`;
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>Print QR Code - ${business.name}</title>
                                <style>
                                  body { 
                                    margin: 0; 
                                    padding: 40px; 
                                    display: flex; 
                                    flex-direction: column; 
                                    align-items: center; 
                                    justify-content: center; 
                                    min-height: 100vh;
                                    font-family: system-ui, -apple-system, sans-serif;
                                  }
                                  img { max-width: 100%; height: auto; }
                                  h1 { margin-top: 20px; font-size: 24px; color: #1e293b; }
                                  p { margin-top: 10px; color: #64748b; font-size: 14px; }
                                </style>
                              </head>
                              <body>
                                <img src="${qrUrl}" alt="QR Code" />
                                <h1>${business.name}</h1>
                                <p>Scan to leave a review</p>
                                <script>
                                  window.onload = function() {
                                    window.print();
                                    window.onafterprint = function() {
                                      window.close();
                                    };
                                  };
                                </script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        } else {
                          // Fallback to regular print if popup blocked
                          window.print();
                        }
                      }}
                      className="text-[10px] font-black text-slate-400 hover:text-brand uppercase tracking-widest text-center py-2 transition-colors cursor-pointer"
                    >
                      Print for display
                    </button>
                  </div>
                </div>
                <div className="md:col-span-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-brand/10 text-brand flex items-center justify-center text-xs">✨</span>
                      Smart Rep Engine
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      This QR code identifies happy customers automatically. If they pick 5 stars, they go to Google. If they pick less, they send you a private lead.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-[#f1f5f9]">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Best Place to Display</div>
                      <p className="text-xs text-slate-600 font-bold">Checkout Counter</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-[#f1f5f9]">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected Conversion</div>
                      <p className="text-xs text-emerald-600 font-bold">+40% Review Rate</p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <span className="text-amber-500 text-sm">💡</span>
                    <span>Pro Tip: Add this code to your printed receipts for the highest scan rate.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Multiple QR Codes for All Users (Locked for Free) */}
          <div className="relative group/qr">
            {!isPro && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-white/60 backdrop-blur-[4px] rounded-[40px] border border-[#e2e8f0]">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Track Multiple Channels</h3>
                <p className="text-[10px] text-slate-500 max-w-[200px] mb-4 font-medium leading-relaxed">
                  Create unique QR codes for every table, staff member, or flyer to see exactly what drives your growth.
                </p>
                <Link href="/pricing" className="primary-button !h-9 px-6 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-transform hover:scale-105 active:scale-95">
                  Upgrade Plan
                </Link>
              </div>
            )}
            <div className={!isPro ? "opacity-30 grayscale pointer-events-none blur-[1px]" : ""}>
              <MultipleQrManager businessId={business.id!} landingUrl={landingUrl || ''} />
            </div>
          </div>

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

          {/* Integrations Card */}
          <section className="premium-card p-8 rounded-3xl bg-accent/30 border-dashed group relative overflow-hidden">
            {!isPro && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-white/60 backdrop-blur-[4px]">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">POS Automations</h3>
                <p className="text-[10px] text-slate-500 max-w-[200px] mb-4 font-medium leading-relaxed">
                  Automatically send review requests after every Square sale. Zero effort, maximum growth.
                </p>
                <Link href="/pricing" className="primary-button !h-9 px-6 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-transform hover:scale-105 active:scale-95">
                  Unlock Automation
                </Link>
              </div>
            )}
            <div className={!isPro ? "opacity-30 grayscale pointer-events-none blur-[1px]" : ""}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Square Integration</h2>
                {squareStatus?.connected ? (
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${squareStatus.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${squareStatus.isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {squareStatus.isEnabled ? 'Active' : 'Paused'}
                    </span>
                  </div>
                ) : isPro ? (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded">Ready to Connect</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand bg-brand/5 px-2 py-1 rounded">Pro Feature</span>
                )}
              </div>

              {squareStatus?.connected ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "Reviews & Marketing is monitoring your Square account for new payments. Requests will be sent automatically."
                  </p>
                  <div className="flex items-center justify-between py-3 border-y border-[#e2e8f0]/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Last Sync</span>
                      <span className="text-xs font-bold text-slate-700">
                        {squareStatus.lastBackfillAt ? new Date(squareStatus.lastBackfillAt).toLocaleDateString() : 'Real-time monitoring active'}
                      </span>
                    </div>
                    <Link href="/integrations/square" className="secondary-button !h-8 px-4 !text-[10px] font-black">
                      Run Manual Backfill
                    </Link>
                  </div>
                  <Link href="/integrations/square" className="text-[10px] font-bold text-brand hover:underline inline-flex items-center gap-1">
                    Manage Integration Settings →
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted mb-6 leading-relaxed">
                    Automatically send review requests to your Square customers after they finish their purchase.
                  </p>
                  <Link href="/integrations/square" className="text-sm font-bold text-brand hover:underline">
                    {isPro ? 'Connect Square Account' : 'Upgrade to Connect Square'} →
                  </Link>
                </>
              )}
            </div>

            {/* Tooltip */}
            <div className="absolute inset-x-0 -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2">
              <div className="bg-slate-900 text-white text-[9px] py-1.5 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest">
                {squareStatus?.connected 
                  ? squareStatus.isEnabled
                    ? "Your Square POS is connected. Every new sale will trigger an automated review request email."
                    : "Real-time monitoring is currently PAUSED. New Square sales will not trigger review requests."
                  : "Connect your Square POS to automatically email customers a review link after every transaction."}
              </div>
            </div>
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

              {recentFeedback.filter(f => f.type === 'feedback' && f.rating <= 2).length > 0 && (
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Action Required: Negative Feedback</span>
                  </div>
                  {recentFeedback.filter(f => f.type === 'feedback' && f.rating <= 2).slice(0, 2).map((item) => (
                    <div key={item.id} className="p-4 bg-red-50/30 rounded-xl border border-red-100/50">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-red-900">{item.name || 'Anonymous'}</span>
                        <span className="text-[10px] font-black text-red-600 px-1.5 py-0.5 bg-red-100 rounded">
                          {item.rating}★
                        </span>
                      </div>
                      <p className="text-xs text-red-700 italic line-clamp-2">"{item.comment}"</p>
                      <Link href="/feedback" className="text-[9px] font-black text-red-600 uppercase tracking-widest mt-2 inline-block hover:underline">Respond Now →</Link>
                    </div>
                  ))}
                </div>
              )}

              {recentFeedback.length === 0 ? (
                <div className="text-center py-12 px-4 border-2 border-dashed border-[#e2e8f0] rounded-2xl">
                  <p className="text-xs text-muted">No feedback yet. Share your link to start collecting responses.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentFeedback.map((item: any, idx: number) => {
                    const isEvent = item.type === 'event';
                    const itemId = item.id || `feedback-${idx}`;
                    return (
                      <div key={itemId} className="p-4 bg-accent/30 rounded-xl border border-[#e2e8f0]/50 hover:border-brand/30 transition-all group/item">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold group-hover/item:text-brand transition-colors">{isEvent ? 'Verified Redirect' : (item.name || 'Anonymous')}</span>
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

      {/* Legend Section */}
      <section className="mt-24 pt-12 border-t border-[#e2e8f0]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">Metric Definitions</h4>
            <ul className="space-y-3">
              <li className="text-xs text-muted flex flex-col gap-1">
                <strong className="text-slate-900">Google Rating</strong>
                The current average star rating of your business on Google Maps.
              </li>
              <li className="text-xs text-muted flex flex-col gap-1">
                <strong className="text-slate-900">Total Scans</strong>
                Every time your unique QR code is scanned or the link is clicked.
              </li>
              <li className="text-xs text-muted flex flex-col gap-1">
                <strong className="text-slate-900">Interactions</strong>
                Customers who took action by clicking a star rating on your landing page.
              </li>
              <li className="text-xs text-muted flex flex-col gap-1">
                <strong className="text-slate-900">Total Leads</strong>
                The number of successful outcomes (Google redirects + private messages).
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">Event Icons</h4>
            <ul className="space-y-3">
              <li className="text-xs text-muted flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-accent flex items-center justify-center text-sm italic">⭐</span>
                <span>Customer redirected to your Google Profile</span>
              </li>
              <li className="text-xs text-muted flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-accent flex items-center justify-center text-sm italic">✉️</span>
                <span>New private feedback or automation message</span>
              </li>
              <li className="text-xs text-muted flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-accent flex items-center justify-center text-sm italic">✨</span>
                <span>A star rating was selected by a user</span>
              </li>
              <li className="text-xs text-muted flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-accent flex items-center justify-center text-sm italic">🌐</span>
                <span>The landing page was opened in a browser</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">Reputation Logic</h4>
            <ul className="space-y-3">
              <li className="text-xs text-muted flex flex-col gap-1 text-emerald-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <strong className="text-emerald-700">5-Star Workflow</strong>
                Happy customers are instantly routed to Google to leave a public review.
              </li>
              <li className="text-xs text-muted flex flex-col gap-1 text-slate-600 bg-slate-50 p-3 rounded-xl border border-[#e2e8f0]">
                <strong className="text-slate-900">1-4 Star Workflow</strong>
                Critical feedback is captured privately, giving you a chance to fix the issue before it goes public.
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">System Status</h4>
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">System Operational</span>
            </div>
            <p className="mt-4 text-[10px] text-muted leading-relaxed">
              All metrics are updated in real-time. Chart data shows performance trends over the last 30 days.
            </p>
          </div>
        </div>
      </section>

      {/* Photo Modal */}
      {isPhotoModalOpen && business.google_photo_url && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div className="relative max-w-4xl w-full aspect-square sm:aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
            <img 
              src={business.google_photo_url} 
              alt={business.name} 
              className="w-full h-full object-contain"
            />
            <button 
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsPhotoModalOpen(false); }}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
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
