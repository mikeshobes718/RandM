"use client";
import BusinessSetupForm from "@/components/onboarding/BusinessSetupForm";
import ProAnalytics from "@/components/dashboard/ProAnalytics";
import MultipleQrManager from "@/components/dashboard/MultipleQrManager";
import ActivationWidget from "@/components/dashboard/ActivationWidget";
import ReviewRequestsModule from "@/components/dashboard/ReviewRequestsModule";
import PlanUsageCard from "@/components/dashboard/PlanUsageCard";
import FeedbackInbox from "@/components/dashboard/FeedbackInbox";
import ContactsPanel from "@/components/dashboard/ContactsPanel";
import SequencePreview from "@/components/dashboard/SequencePreview";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { formatPhone } from '@/lib/phone';
import { clientAuth } from '@/lib/firebaseClient';
import { onAuthStateChanged } from "firebase/auth";
import { resolveRoute } from '@/lib/resolveRoute';

type Business = {
  id: string | null;
  name: string;
  slug?: string | null;
  review_link?: string | null;
  google_maps_write_review_uri?: string | null;
  contact_phone?: string | null;
  google_rating?: number | null;
  google_place_id?: string | null;
  google_photo_url?: string | null;
  address?: string | null;
  business_type?: string | null;
  landing_headline?: string | null;
  landing_subheading?: string | null;
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

type Campaign = {
  id?: string;
  name: string;
  type?: string;
  sent: number;
  clicks: number;
  failed?: number;
  date: string;
};

import { MiniHowItWorks } from '@/components/MiniHowItWorks';
import { QrCode, Smartphone, GitFork, TrendingUp } from 'lucide-react';

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
  const [planUsage, setPlanUsage] = useState({ used: 0, limit: 100, qrScans: 0, isUnlimited: false, planName: 'Small Business', contactsCount: 0 });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [rates, setRates] = useState({ delivered: 0, click: 0, optOut: 0 });
  const [isActivated, setIsActivated] = useState(false);
  const [activeTab, setActiveTab] = useState<'review-toolkit' | 'sequences' | 'analytics'>('review-toolkit');
  const [isUpdatingContent, setIsUpdatingContent] = useState(false);



  const handleUpdateContent = async (key: string, value: string) => {
    if (!business?.id || isUpdatingContent) return;
    setIsUpdatingContent(true);
    try {
      const dbKey = key === 'headline' ? 'landing_headline' : 'landing_subheading';
      const res = await fetch('/api/businesses/upsert/form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: business.id, [dbKey]: value }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setBusiness(prev => prev ? { ...prev, [dbKey]: value } : null);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setIsUpdatingContent(false);
    }
  };

  const landingUrl = useMemo(() => {
    if (!business?.id) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.reviewsandmarketing.com';
    // Use DB slug if available, else derive from name, else fallback to id
    const computedSlug = business.name
      ? business.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 50)
      : null;
    const path = business.slug || computedSlug || business.id;
    return `${origin}/r/${path}?source=main-qr`;
  }, [business?.id, business?.slug, business?.name]);

  const isFromEdit = searchParams?.get('from') === 'edit';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(clientAuth, (user) => {
      loadDashboardData(user);
    });

    const loadDashboardData = async (user: any) => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};

        if (user) {
          const tok = await user.getIdToken();
          headers['Authorization'] = `Bearer ${tok}`;
        } else {
          const tok = localStorage.getItem('idToken');
          if (tok) headers['Authorization'] = `Bearer ${tok}`;
        }

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
        setPlanUsage(data.planUsage ?? { used: 0, limit: 100, qrScans: 0, isUnlimited: false });
        setRecentCampaigns(data.recentCampaigns ?? []);
        setRates(data.rates ?? { delivered: 0, click: 0, optOut: 0 });

        // Only redirect to onboarding if there is genuinely no business.
        // NEVER redirect to /select-plan from the dashboard.
        if (!data.business) {
          window.location.replace('/onboarding/business');
          return;
        }

      } catch (err: any) {
        // If the dashboard API fails, use resolveRoute to send the user
        // to the correct place instead of showing a dead-end error.
        if (user) {
          try {
            const tok = await user.getIdToken();
            const dest = await resolveRoute(tok);
            if (dest !== '/dashboard') {
              window.location.replace(dest);
              return;
            }
          } catch {}
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return () => unsubscribe();
  }, []);


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
    <div className="max-w-6xl mx-auto px-6 pt-24 pb-12 sm:pt-32" data-deployment="jan19-final-v4">
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
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                Dashboard
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Live v2.1</span>
              </h1>
              <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">System Normal</span>
              </div>
            </div>
            <p className="text-muted text-sm font-medium flex items-center gap-2">
              Connected to {business.name}
              {business.address && (
                <span className="text-slate-400 font-normal border-l border-[#e2e8f0] pl-2 ml-1">
                  {business.address.split(',')[0]}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center lg:flex-nowrap">
          <Link href="/contacts" className="inline-flex items-center gap-2 px-4 h-10 bg-brand text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:bg-brand/90 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-brand/20">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            Contacts
          </Link>
          <Link href="/onboarding/business?edit=1" className="inline-flex items-center gap-2 px-4 h-10 bg-white text-slate-700 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 hover:border-slate-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H5a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            Business
          </Link>
          <Link href="/settings" className="inline-flex items-center gap-2 px-4 h-10 bg-white text-slate-700 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 hover:border-slate-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Settings
          </Link>
        </div>
      </div>

      {/* Top Row: Plan Usage (Horizontal) */}
      <div className="mb-8">
        <PlanUsageCard
          planName={planUsage.planName}
          requestsUsed={planUsage.used}
          requestsLimit={planUsage.limit}
          qrScans={planUsage.qrScans}
          isUnlimited={planUsage.isUnlimited}
          isPro={isPro}
          planStatus={planStatus}
        />
      </div>

      {/* Feedback Inbox */}
      <div className="mb-12">
        <FeedbackInbox initialItems={recentFeedback} businessId={business.id!} />
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 mb-8 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('review-toolkit')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'review-toolkit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          Review Toolkit
        </button>
        <button
          onClick={() => setActiveTab('sequences')}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sequences' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          Sequences
        </button>
      </div>

      {activeTab === 'review-toolkit' && (
        <div className="animate-fade-in">
          <div className="mb-12">
            <section className="premium-card p-8 rounded-3xl overflow-hidden relative group bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
              <h2 className="text-xl font-bold mb-2">Review Toolkit</h2>
              <p className="text-sm text-muted mb-8 font-medium">Your core tools for collecting customer reviews.</p>

              <div className="space-y-8">
                <div className="relative group/copy">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Main QR Tracking Link</label>
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
                      The smart link that routes reviews to the right place.
                    </div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-stretch pt-8 border-t border-[#e2e8f0]/50">
                  {/* Left: The QR Code itself */}
                  <div className="lg:w-1/3 flex flex-col items-center justify-between gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="bg-white p-4 border-4 border-slate-50 rounded-[32px] shadow-2xl shadow-slate-200/50 group-hover:scale-[1.02] transition-transform w-full max-w-[220px] mx-auto">
                      <img
                        src={`/api/qr?data=${encodeURIComponent(landingUrl || '')}&format=png&scale=8`}
                        alt="QR Code"
                        className="w-full aspect-square"
                      />
                    </div>
                    <div className="flex flex-col gap-2 w-full mt-4">
                      <a
                        href={`/api/qr?data=${encodeURIComponent(landingUrl || '')}&format=png&scale=12`}
                        download={`${business.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`}
                        className="primary-button !h-11 w-full text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Asset
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
                            window.print();
                          }
                        }}
                        className="secondary-button !h-11 w-full text-xs font-black text-slate-500 uppercase tracking-widest bg-white border border-slate-200 transition-colors"
                      >
                        Print QR Code
                      </button>
                      <a
                        href="/One_Page_Overview.pdf"
                        target="_blank"
                        className="text-[10px] font-black text-brand uppercase tracking-widest text-center mt-2 hover:underline inline-flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Download Print Assets
                      </a>
                    </div>
                  </div>

                  {/* Right: The Sequence Explanation */}
                  <div className="lg:w-2/3 flex flex-col justify-between">
                    <MiniHowItWorks 
                      className="mt-0 mb-8 flex-1"
                      title="Smart QR Engine"
                      steps={[
                        { icon: QrCode, title: "1. Print QR", desc: "Place your QR code on receipts, tables, or counters." },
                        { icon: Smartphone, title: "2. Customer Scans", desc: "They scan the code with their phone camera." },
                        { icon: GitFork, title: "3. Smart Filter", desc: "5-stars go to Google. 1-4 stars go to your inbox." },
                        { icon: TrendingUp, title: "4. Grow", desc: "Watch your public rating climb automatically." }
                      ]}
                    />

                    {/* Pro Tips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1 flex items-center gap-1.5"><span className="text-sm">💡</span> Best Placement</h4>
                        <p className="text-xs text-amber-800/80 font-medium">Add to checkout counters, receipts, dining tables, business cards, mailers, and front doors to increase scans. You need to nicely design it and put it around your store. You can do it yourself or have us design it. Be creative!</p>
                      </div>
                      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5"><span className="text-sm">🎨</span> Need a Design?</h4>
                        <p className="text-xs text-slate-300 font-medium mb-3">We design custom printed QR assets for your store.</p>
                        <a href="mailto:hello@reviewsandmarketing.com?subject=Custom Design Request" className="inline-flex items-center justify-center h-8 text-[9px] font-black text-slate-900 bg-white hover:bg-slate-100 px-4 rounded-lg transition-colors uppercase tracking-widest shadow-sm">Request Design</a>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Primary Action: Review Requests */}
          <div className="mb-12">
            <ReviewRequestsModule
              used={planUsage.used}
              limit={planUsage.limit}
              recentCampaigns={recentCampaigns}
              isPro={isPro}
              deliveredRate={rates.delivered}
              clickRate={rates.click}
              optOutRate={rates.optOut}
            />
          </div>

          {/* QR Best Practices & Helpful Tip (removed from bottom as moved up) */}
        </div>
      )}

      {activeTab === 'sequences' && business && (
        <div className="animate-fade-in space-y-12 mb-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Review Sequences</h2>
                <p className="text-sm text-muted font-medium">How your customers experience the review process.</p>
              </div>
            </div>
            <SequencePreview
              businessName={business.name}
              headline={business.landing_headline || undefined}
              subheading={business.landing_subheading || undefined}
            />
          </div>
        </div>
      )}


      {/* Moved Checklist (if finished) */}
      {isActivated && (
        <div className="mt-24 pt-12 border-t border-slate-100">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 text-center mb-8">Onboarding Completed</h4>
          <div className="max-w-4xl mx-auto opacity-60 hover:opacity-100 transition-opacity">
            <ActivationWidget
              business={business}
              stats={stats}
              recentFeedbackCount={recentFeedback.length}
              isPro={isPro}
              onStatusChange={setIsActivated}
            />
          </div>
        </div>
      )}

      {/* Legend Section */}
      <section className="mt-24 pt-12 border-t border-[#e2e8f0]">
        {/* Advanced Analytics & Insights Section (always visible at bottom for perceived value) */}
        <div className="mt-12 relative mb-12">
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

        {!isActivated && (
          <div className="mb-12">
            <ActivationWidget
              business={business}
              stats={stats}
              recentFeedbackCount={recentFeedback.length}
              isPro={isPro}
              onStatusChange={setIsActivated}
            />
          </div>
        )}
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
