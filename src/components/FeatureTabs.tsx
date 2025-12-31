"use client";

import { useState } from "react";

type TabKey = "links" | "qr" | "automation" | "analytics";

const tabs: { key: TabKey; title: string; description: string }[] = [
  {
    key: "links",
    title: "Smart Links",
    description:
      "One-tap review links that open the Google review dialog instantly. Branded, trackable, and optimized for high conversion.",
  },
  {
    key: "qr",
    title: "Smart QR Codes",
    description:
      "Beautiful, print-ready QR codes that smartly route customers based on their feedback—protecting your reputation automatically.",
  },
  {
    key: "automation",
    title: "Automation",
    description:
      "Automated follow-ups and request flows that boost response rates without any manual work from your team.",
  },
  {
    key: "analytics",
    title: "Deep Analytics",
    description:
      "Gain actionable insights into your reputation growth with real-time tracking of scans, clicks, and review sentiment.",
  },
];

export function FeatureTabs() {
  const [active, setActive] = useState<TabKey>("links");

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                isActive
                  ? "bg-brand text-white border-brand shadow-lg shadow-brand/20"
                  : "bg-white text-muted border-border hover:border-brand/30 hover:text-foreground"
              }`}
              aria-pressed={isActive}
            >
              {t.title}
            </button>
          );
        })}
      </div>

      <div className="premium-card rounded-3xl p-8 md:p-12 min-h-[400px] flex flex-col">
        <div className="max-w-2xl mb-10">
          <h3 className="text-2xl font-black tracking-tight mb-4">
            {tabs.find((t) => t.key === active)?.title}
          </h3>
          <p className="text-muted leading-relaxed">
            {tabs.find((t) => t.key === active)?.description}
          </p>
        </div>
        
        <div className="flex-1">
          {active === "links" && <DemoLinks />}
          {active === "qr" && <DemoQr />}
          {active === "automation" && <DemoAutomation />}
          {active === "analytics" && <DemoAnalytics />}
        </div>
      </div>
    </div>
  );
}

function DemoLinks() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
      <div className="p-6 bg-accent/50 rounded-2xl border border-border/50">
        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Live Preview</div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold truncate">Beacon Dental Reviews</div>
            <div className="text-xs text-brand truncate">reviewsandmarketing.com/r/beacon</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-6 bg-brand/5 rounded-2xl border border-brand/10">
        <div className="text-[10px] font-bold text-brand uppercase tracking-widest mb-4">Sharing Channels</div>
        <div className="flex flex-wrap gap-2">
          {['SMS', 'Email', 'WhatsApp', 'QR', 'NFC'].map(tag => (
            <span key={tag} className="px-3 py-1.5 bg-white border border-brand/20 text-brand text-xs font-bold rounded-lg shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoQr() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center animate-fade-in">
      <div className="relative group">
        <div className="aspect-square max-w-[240px] mx-auto bg-white p-6 rounded-3xl border border-border shadow-xl relative z-10 transition-transform group-hover:-rotate-2">
          <div className="w-full h-full bg-slate-100 rounded-xl grid place-content-center text-slate-400 font-black text-2xl tracking-tighter">
            QR CODE
          </div>
        </div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-[240px] aspect-square bg-brand/10 rounded-3xl -rotate-6 -z-0"></div>
      </div>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold">Smart Routing</div>
            <div className="text-xs text-muted">Happy customers → Google Reviews</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold">Feedback Filter</div>
            <div className="text-xs text-muted">Others → Private Feedback Form</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoAutomation() {
  const steps = [
    { title: "Review Request", delay: "Immediate", icon: "📧" },
    { title: "Friendly Reminder", delay: "2 days later", icon: "🔔" },
    { title: "Thank You Note", delay: "Post-review", icon: "✨" },
  ];
  return (
    <div className="space-y-4 max-w-md animate-fade-in">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-accent/30 rounded-2xl border border-border/50">
          <div className="text-2xl">{step.icon}</div>
          <div className="flex-1">
            <div className="text-sm font-bold">{step.title}</div>
            <div className="text-[10px] text-muted uppercase font-black">{step.delay}</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        </div>
      ))}
    </div>
  );
}

function DemoAnalytics() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Scans', val: '1,284', grow: '+12%' },
          { label: 'Reviews', val: '428', grow: '+8%' },
          { label: 'Rating', val: '4.9', grow: '+0.2' },
          { label: 'Sentiment', val: '94%', grow: '+3%' },
        ].map(s => (
          <div key={s.label} className="p-4 bg-white rounded-2xl border border-border shadow-sm">
            <div className="text-[10px] font-bold text-muted uppercase mb-1">{s.label}</div>
            <div className="text-xl font-black tracking-tight">{s.val}</div>
            <div className="text-[10px] font-bold text-emerald-600">{s.grow}</div>
          </div>
        ))}
      </div>
      <div className="h-32 flex items-end gap-2 px-2">
        {[40, 65, 45, 90, 55, 80, 70, 95, 60, 85].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-brand/10 rounded-t-lg hover:bg-brand transition-colors relative group"
            style={{ height: `${h}%` }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
              {h} reviews
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeatureTabs;
