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
import InfoTip from '@/components/InfoTip';

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
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [rates, setRates] = useState({ delivered: 0, click: 0, optOut: 0 });
  const [isActivated, setIsActivated] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'toolkit' | 'sequences'>('overview');
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
        setOwnerEmail(typeof data.ownerEmail === 'string' ? data.ownerEmail : null);
        setRates(data.rates ?? { delivered: 0, click: 0, optOut: 0 });

        if (!data.business) {
          window.location.replace('/onboarding/business');
          return;
        }
      } catch (err: any) {
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
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
        <p className="text-on-surface-variant text-sm font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 bg-error-container text-error rounded-2xl flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-3xl">warning</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Failed to load dashboard</h2>
        <p className="text-on-surface-variant text-sm max-w-xs mb-8">{error}</p>
        <button onClick={() => window.location.reload()} className="primary-button !h-11 px-8">Try again</button>
      </div>
    );
  }

  if (!business || !business.id) return null;

  const kpis = [
    { icon: "mail", label: "Total Requests", value: stats.reviewsThisMonth, change: analytics?.growth ? `+${analytics.growth}%` : null, color: "primary", tip: "Review requests or outreach sends counted this billing period." },
    { icon: "qr_code_2", label: "QR Scans", value: stats.shareLinkScans, change: null, color: "secondary", tip: "Times customers opened your main review link or scanned your QR code." },
    { icon: "ads_click", label: "Click Rate", value: rates.click > 0 ? `${rates.click}%` : "—", change: null, color: "tertiary", tip: "Percentage of delivered messages where the customer tapped your review link." },
    { icon: "star", label: "Avg Rating", value: stats.averageRating ?? "—", change: null, color: "error", tip: "Average Google rating we last synced for your business profile." },
  ];

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {business.google_photo_url && (
            <div 
              className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
              onClick={() => setIsPhotoModalOpen(true)}
            >
              <img src={business.google_photo_url} alt={business.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-on-surface whitespace-nowrap">
                Business Overview
              </h1>
              <InfoTip text="Your home base for review activity, customer messages, outreach, and (on Pro) full analytics." />
            </div>
            <p className="text-on-surface-variant text-sm sm:text-base leading-snug">
              Welcome back — here&apos;s what&apos;s happening with <span className="font-bold text-on-surface">{business.name}</span>.
            </p>
          </div>
        </div>
        <div className="flex w-full min-w-0 max-w-full gap-1 p-1 bg-surface-container-low rounded-2xl">
          {(["overview", "toolkit", "sequences"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-0 px-2 sm:px-4 py-2.5 rounded-xl text-center text-xs sm:text-sm font-bold leading-tight transition-all ${
                activeTab === tab ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:bg-white/50"
              }`}
            >
              {tab === "overview" ? "Reviews" : tab === "toolkit" ? "QR" : "Sequences"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/15">
            <div className="flex justify-between items-start mb-3">
              <span className={`p-2 bg-${kpi.color}/10 text-${kpi.color} rounded-lg material-symbols-outlined`}>{kpi.icon}</span>
              {kpi.change && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{kpi.change}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">{kpi.label}</p>
              <InfoTip compact text={kpi.tip} />
            </div>
            <h3 className="text-3xl font-bold text-primary mt-1">{kpi.value}</h3>
          </div>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="animate-fade-in">
          {/* Main Grid: 8 + 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (8) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Plan Usage */}
              <PlanUsageCard
                planName={planUsage.planName}
                requestsUsed={planUsage.used}
                requestsLimit={planUsage.limit}
                qrScans={planUsage.qrScans}
                isUnlimited={planUsage.isUnlimited}
                isPro={isPro}
                planStatus={planStatus}
              />

              {/* Feedback Inbox */}
              <FeedbackInbox initialItems={recentFeedback} businessId={business.id!} />

              {/* Review Requests Module */}
              <ReviewRequestsModule
                used={planUsage.used}
                limit={planUsage.limit}
                recentCampaigns={recentCampaigns}
                isPro={isPro}
                deliveredRate={rates.delivered}
                clickRate={rates.click}
                optOutRate={rates.optOut}
                replyToEmail={ownerEmail ?? clientAuth.currentUser?.email ?? null}
              />
            </div>

            {/* Right Column (4) */}
            <div className="lg:col-span-4 space-y-6 lg:self-start">
              {/* Setup Progress */}
              {!isActivated && (
                <ActivationWidget
                  business={business}
                  stats={stats}
                  recentFeedbackCount={recentFeedback.length}
                  isPro={isPro}
                  onStatusChange={setIsActivated}
                />
              )}

              {/* QR Toolkit Mini */}
              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/15">
                <h4 className="font-bold mb-4">Review Toolkit</h4>
                <div className="bg-surface p-4 rounded-lg border border-dashed border-outline-variant flex flex-col items-center">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <img
                      src={`/api/qr?data=${encodeURIComponent(landingUrl || '')}&format=png&scale=6`}
                      alt="QR Code"
                      className="w-24 h-24"
                    />
                  </div>
                  <p className="text-center font-bold text-sm mb-1">Smart QR Engine</p>
                  <p className="text-center text-xs text-on-surface-variant mb-4">Dynamic redirect based on sentiment</p>
                  <div className="flex gap-2 w-full">
                    <a
                      href={`/api/qr?data=${encodeURIComponent(landingUrl || '')}&format=png&scale=12`}
                      download={`${business.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`}
                      className="flex-1 py-2 bg-surface-container-high text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">download</span> Save
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 py-2 bg-surface-container-high text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">{copyState === 'copied' ? 'check' : 'content_copy'}</span>
                      {copyState === 'copied' ? 'Copied!' : 'Link'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Activation Guide */}
              <div className="bg-primary text-white p-6 rounded-xl shadow-lg signature-gradient">
                <h4 className="font-bold mb-4">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "person_add", label: "Import", href: "/contacts" },
                    { icon: "qr_code", label: "QR Tools", href: "#", action: () => setActiveTab("toolkit") },
                    { icon: "campaign", label: "Campaign", href: "/requests/new" },
                    { icon: "rocket_launch", label: "Go Live", href: "/templates" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={item.action}
                      className="bg-white/10 p-3 rounded-lg flex flex-col items-center hover:bg-white/20 transition-colors"
                    >
                      <span className="material-symbols-outlined mb-1">{item.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Pro Analytics (Full Width) */}
            <div className="lg:col-span-12">
              <div className="relative min-h-[360px]">
                {!isPro && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-white/40 backdrop-blur-[6px] rounded-2xl border-2 border-dashed border-primary/20">
                    <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                      <span className="material-symbols-outlined text-3xl">lock</span>
                    </div>
                    <h2 className="text-2xl font-extrabold mb-2">Unlock Business Intelligence</h2>
                    <p className="text-on-surface-variant max-w-md mb-6 text-sm">
                      Upgrade to see daily trends, lead sources, and customer sentiment analytics.
                    </p>
                    <Link href="/pricing" className="primary-button h-12 px-8 shadow-lg">Upgrade Now</Link>
                  </div>
                )}
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
            </div>
          </div>
        </div>
      )}

      {activeTab === "toolkit" && (
        <div className="animate-fade-in">
          <section className="bg-surface-container-lowest p-8 rounded-2xl overflow-hidden relative border border-outline-variant/15 shadow-sm">
            <h2 className="text-xl font-bold mb-2">Review Toolkit</h2>
            <p className="text-sm text-on-surface-variant mb-8 font-medium">Your core tools for collecting customer reviews.</p>

            <div className="space-y-8">
              <div className="relative group/copy">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest block mb-2">Main QR Tracking Link</label>
                <div className="flex gap-2 p-1 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl">
                  <div className="flex-1 h-11 bg-surface rounded-xl px-4 flex items-center text-sm font-mono truncate text-on-surface-variant border border-outline-variant/20 shadow-sm">
                    {landingUrl}
                  </div>
                  <button onClick={handleCopyLink} className={`primary-button !h-11 px-8 text-xs font-black uppercase tracking-widest transition-all ${copyState === 'copied' ? '!bg-emerald-500 !shadow-emerald-100' : ''}`}>
                    {copyState === 'copied' ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-8 items-stretch pt-8 border-t border-outline-variant/20">
                <div className="lg:w-1/3 flex flex-col items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20">
                  <div className="bg-surface p-4 border-4 border-outline-variant/20 rounded-[32px] shadow-2xl w-full max-w-[220px] mx-auto">
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
                      className="primary-button !h-11 w-full text-xs font-black uppercase tracking-widest"
                    >
                      <span className="material-symbols-outlined text-sm mr-2">download</span>
                      Download Asset
                    </a>
                    <button
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          const qrUrl = `/api/qr?data=${encodeURIComponent(landingUrl || '')}&format=png&scale=12`;
                          printWindow.document.write(`<html><head><title>Print QR - ${business.name}</title><style>body{margin:0;padding:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui}img{max-width:100%;height:auto}h1{margin-top:20px;font-size:24px}p{margin-top:10px;color:#64748b;font-size:14px}</style></head><body><img src="${qrUrl}" alt="QR Code"/><h1>${business.name}</h1><p>Scan to leave a review</p><script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}};</script></body></html>`);
                          printWindow.document.close();
                        }
                      }}
                      className="secondary-button !h-11 w-full text-xs font-black uppercase tracking-widest"
                    >
                      Print QR Code
                    </button>
                  </div>
                </div>

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Best Placement</h4>
                      <p className="text-xs text-amber-800/80 font-medium">Add to checkout counters, receipts, dining tables, business cards, and front doors.</p>
                    </div>
                    <div className="p-4 bg-inverse-surface rounded-2xl">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-inverse-on-surface/70 mb-1">Need a Design?</h4>
                      <p className="text-xs text-inverse-on-surface/80 font-medium mb-3">We design custom printed QR assets for your store.</p>
                      <a href="mailto:hello@reviewsandmarketing.com?subject=Custom Design Request" className="inline-flex items-center h-8 text-[9px] font-black text-on-surface bg-surface px-4 rounded-lg uppercase tracking-widest">Request Design</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "sequences" && business && (
        <div className="animate-fade-in space-y-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Review Sequences</h2>
                <p className="text-sm text-on-surface-variant font-medium">How your customers experience the review process.</p>
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

      {/* Photo Modal */}
      {isPhotoModalOpen && business.google_photo_url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-inverse-surface/90 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div className="relative max-w-4xl w-full aspect-square sm:aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
            <img src={business.google_photo_url} alt={business.name} className="w-full h-full object-contain" />
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsPhotoModalOpen(false); }}
            >
              <span className="material-symbols-outlined">close</span>
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
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
