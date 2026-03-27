export const dynamic = 'force-dynamic';

import Link from "next/link";
import { FeatureTabs } from "@/components/FeatureTabs";
import HomeCtaButtons from "@/components/HomeCtaButtons";
import { AnimatedFlow } from "@/components/AnimatedFlow";

const PILLARS = [
  { icon: 'qr_code_2', title: 'Compliant QR Flow', copy: 'Protect your relationship with customers. We help happy customers share their experiences on Google while providing a private channel for those who have suggestions.' },
  { icon: 'bolt', title: 'Automated Requests', copy: 'Send review requests automatically via SMS or Email. Optimized timing ensures the highest response rates possible, all while staying compliant with platform policies.' },
  { icon: 'monitoring', title: 'Actionable Insights', copy: 'Track scans, clicks, and feedback sentiment in real-time. Identify your best locations and top performers based on genuine customer insights.' },
];

const USE_CASES = [
  { title: 'For Restaurants', text: 'Place QR codes on table tents or check folders. Turn a great meal into a public review or a private thank-you before the guest leaves.' },
  { title: 'For Retail', text: 'Print review links on receipts or display at checkout. Build a loyal customer base and boost your local search ranking with authentic feedback.' },
  { title: 'For Services', text: 'Send automated follow-ups after a service appointment. Capture honest feedback and reviews while the experience is fresh.' },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden bg-surface-container-low">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary text-xs font-semibold mb-8">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
              Platform Overview
            </div>
            <h1 className="text-balance mb-6">
              Everything you need to <br className="hidden md:block" />
              <span className="text-primary">master your reputation.</span>
            </h1>
            <div className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-5 text-balance leading-relaxed">
              <p>Get more Google reviews the compliant way + recover unhappy customers privately.</p>
              <p className="mt-2 font-bold text-primary">More reviews, more insights, fewer surprises.</p>
            </div>
            <p className="text-sm text-on-surface-variant/60 max-w-2xl mx-auto mb-10 leading-relaxed italic">
              &quot;We provide customers a direct path to share their experience. We don&apos;t incentivize or gate reviews -- we use smart Review Routing.&quot;
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <HomeCtaButtons variant="hero" />
              <Link
                href="/how-it-works"
                className="secondary-button h-12 px-8 flex items-center gap-2 group"
              >
                Watch the Walkthrough
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-0.5" style={{ fontSize: 18 }}>play_circle</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 pointer-events-none opacity-[0.04]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,var(--primary),transparent_70%)]" />
        </div>
      </section>

      {/* Core Pillars */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {PILLARS.map((pillar) => (
              <div key={pillar.title} className="group">
                <div className="w-12 h-12 rounded-xl bg-primary/8 text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{pillar.icon}</span>
                </div>
                <h3 className="text-lg font-bold mb-3">{pillar.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{pillar.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works inline */}
      <section className="py-20 bg-surface-container-low">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="mb-3">How it works</h2>
            <p className="text-on-surface-variant">Simple, automated reputation management in three steps.</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <AnimatedFlow />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="mb-3">Deep dive into the toolkit</h2>
            <p className="text-on-surface-variant">Explore the powerful features that make Reviews & Marketing the choice for top operators.</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <FeatureTabs />
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="mb-3">Built for every industry</h2>
            <p className="text-on-surface-variant">Whether you run a single shop or multiple locations, we have you covered.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {USE_CASES.map((uc) => (
              <div key={uc.title} className="surface-card p-8">
                <h3 className="text-base font-bold mb-3">{uc.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{uc.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="p-10 md:p-14 rounded-2xl primary-gradient text-on-primary flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-5 text-on-primary">Ready to scale your reputation?</h2>
              <p className="text-on-primary/70 text-base mb-8 leading-relaxed">
                Join the growing list of businesses using our toolkit to dominate their local market. Start free and upgrade when you&apos;re ready for more.
              </p>
              <HomeCtaButtons align="start" />
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-3 w-full md:w-auto">
              {[
                { value: 'Active', label: 'Businesses' },
                { value: '15K+', label: 'Feedback Items' },
                { value: '4.9\u2605', label: 'Avg Rating' },
                { value: 'Direct', label: 'Impact' },
              ].map((stat) => (
                <div key={stat.label} className="p-5 bg-white/10 rounded-xl text-center">
                  <div className="text-xl font-bold text-on-primary mb-0.5">{stat.value}</div>
                  <div className="text-[10px] font-semibold text-on-primary/60 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
