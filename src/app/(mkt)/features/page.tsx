export const dynamic = 'force-dynamic';

import Link from "next/link";
import { FeatureTabs } from "@/components/FeatureTabs";
import HomeCtaButtons from "@/components/HomeCtaButtons";

const PILLARS = [
  {
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    title: 'Smart QR Routing',
    copy: 'Protect your rating. Happy customers go to Google, while others are routed to a private feedback form for resolution.',
  },
  {
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Automated Requests',
    copy: 'Send review requests automatically via SMS or Email. Optimized timing ensures the highest response rates possible.',
  },
  {
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Actionable Insights',
    copy: 'Track scans, clicks, and review sentiment in real-time. Identify your best locations and top performers instantly.',
  },
];

const USE_CASES = [
  {
    title: 'For Restaurants',
    text: 'Place QR codes on table tents or check folders. Turn a great meal into a 5-star Google review before the guest leaves.',
  },
  {
    title: 'For Retail',
    text: 'Print review links on receipts or display at checkout. Build a loyal customer base and boost your local search ranking.',
  },
  {
    title: 'For Services',
    text: 'Send automated follow-ups after a service appointment. Capture feedback and reviews while the experience is fresh.',
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-border bg-accent/30">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-8">
              Platform Overview
            </div>
            <h1 className="text-balance mb-8">
              Everything you need to <br className="hidden md:block" />
              <span className="text-brand">master your reputation.</span>
            </h1>
            <p className="text-xl text-muted max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
              A complete toolkit designed to help modern businesses collect more reviews, filter private feedback, and grow faster.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <HomeCtaButtons variant="hero" />
            </div>
          </div>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 pointer-events-none opacity-[0.03]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,var(--brand),transparent_70%)]"></div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="group">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <div className="w-6 h-6">{pillar.icon}</div>
                </div>
                <h3 className="text-xl font-bold mb-4">{pillar.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{pillar.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Tabs */}
      <section className="py-24 bg-accent/50 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight mb-4">Deep dive into the toolkit</h2>
            <p className="text-muted">Explore the powerful features that make Reviews & Marketing the choice for top operators.</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <FeatureTabs />
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight mb-4">Built for every industry</h2>
            <p className="text-muted">Whether you run a single shop or 100 locations, we have you covered.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {USE_CASES.map((uc) => (
              <div key={uc.title} className="premium-card p-8 rounded-3xl">
                <h3 className="text-lg font-bold mb-4">{uc.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{uc.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="p-10 md:p-16 rounded-[40px] bg-foreground text-white flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-brand/10 blur-[120px] -z-0"></div>
            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6 text-white">Ready to scale your reputation?</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Join 500+ businesses using our toolkit to dominate their local market. Start free and upgrade when you're ready for more.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/pricing" className="primary-button h-12 px-8">
                  View Pricing
                </Link>
                <Link href="/register" className="secondary-button !bg-white/10 !text-white !border-white/20 h-12 px-8 hover:!bg-white/20">
                  Get Started Free
                </Link>
              </div>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm text-center">
                <div className="text-2xl font-black mb-1 text-white">500+</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Businesses</div>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm text-center">
                <div className="text-2xl font-black mb-1 text-white">15K+</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reviews</div>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm text-center">
                <div className="text-2xl font-black mb-1 text-white">4.9★</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Rating</div>
              </div>
              <div className="p-6 bg-brand rounded-2xl text-center shadow-lg shadow-brand/20">
                <div className="text-2xl font-black mb-1 text-white">3x</div>
                <div className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Growth</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
