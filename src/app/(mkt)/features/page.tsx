export const dynamic = 'force-static';

import Link from "next/link";
import { FeatureTabs } from "@/components/FeatureTabs";

const METRICS = [
  { value: '5/mo', label: 'Starter review requests', tone: 'from-indigo-500/80 to-violet-500/90' },
  { value: '1 QR kit', label: 'Included on every plan', tone: 'from-emerald-400/80 to-emerald-500/90' },
  { value: 'Multi-location', label: 'Routing on Pro', tone: 'from-sky-400/80 to-blue-500/90' },
];

const PILLARS = [
  {
    iconBg: 'from-blue-500 to-indigo-500',
    title: 'Review request templates',
    copy: 'Send branded email requests in minutes. Starter covers five asks each month, and Pro unlocks more volume with the same polished tone.',
  },
  {
    iconBg: 'from-purple-500 to-fuchsia-500',
    title: 'QR code builder',
    copy: 'Generate table-tent and receipt-ready QR codes that launch guests directly into your Google review flow.',
  },
  {
    iconBg: 'from-emerald-500 to-teal-500',
    title: 'Live performance dashboard',
    copy: 'Track scans, clicks, and new reviews across every location from a single workspace.',
  },
];

const HIGHLIGHTS = [
  {
    title: 'Everything you need to launch asks',
    bullets: [
      'Starter plan: five branded review requests per month',
      'Email templates validated on real operators',
      'Pro plan adds higher volume and priority support when you scale',
    ],
  },
  {
    title: 'Stay coordinated as your locations grow',
    bullets: [
      'Route guests to the right review destination per location',
      'Invite teammates on Pro to assign follow-ups and keep tabs on private feedback',
      'Monitor average rating, scans, and clicks from the dashboard view',
    ],
  },
  {
    title: 'Ready-to-share QR kits',
    bullets: [
      'Download high-resolution QR codes with your colors and logo',
      'Use the included landing page for kiosks, receipts, and packaging',
      'Swap destinations without reprinting—links stay updated automatically',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-indigo-50 to-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-300px] h-[520px] rounded-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.2),transparent_60%)] blur-3xl" />
        <div className="absolute left-[-220px] top-1/3 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.22),transparent_70%)] blur-3xl" />
        <div className="absolute right-[-180px] bottom-[-120px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18),transparent_75%)] blur-3xl" />
      </div>

      <section className="relative px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-slate-900/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-300 shadow-sm shadow-slate-900/5 backdrop-blur">
            Platform tour
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            The modern stack for ⭐⭐⭐⭐⭐ growth
          </h1>
          <p className="mt-5 text-lg text-slate-300 md:text-xl">
            Reviews & Marketing brings share links, QR kits, and live analytics together so every happy customer can leave a public review.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"
            >
              Get Started Free
              <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-900/80 px-7 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-900"
            >
              Talk to Sales
            </Link>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {METRICS.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-white/70 bg-slate-900/80 p-5 text-left shadow-lg shadow-slate-900/10 backdrop-blur">
                <div className={`inline-flex items-center rounded-full bg-gradient-to-r ${metric.tone} px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white`}>{metric.label}</div>
                <div className="mt-3 text-3xl font-semibold text-white">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="group rounded-3xl border border-white/70 bg-slate-900/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className={`mb-6 grid h-12 w-12 place-content-center rounded-xl bg-gradient-to-br ${pillar.iconBg} text-white`}> 
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white capitalize">{pillar.title}</h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">{pillar.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2">
            {HIGHLIGHTS.map((section) => (
              <div key={section.title} className="rounded-3xl border border-white/70 bg-slate-900/80 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
                <h3 className="text-2xl font-semibold text-white">{section.title}</h3>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-white/70 bg-slate-900/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
            <FeatureTabs />
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/70 bg-slate-900/80 p-6 shadow-xl shadow-slate-900/10 backdrop-blur md:flex md:items-center md:justify-between md:gap-10 md:p-8">
          <div>
            <h3 className="text-2xl font-semibold text-white">Compare plans</h3>
            <p className="mt-2 text-sm text-slate-300">See which package pairs best with your growth stage—each plan includes live onboarding.</p>
          </div>
          <div className="mt-6 flex items-center gap-3 md:mt-0">
            <div className="hidden items-center gap-3 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 md:flex">
              <span>Starter</span>
              <span>•</span>
              <span>Pro</span>
              <span>•</span>
              <span>Enterprise</span>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5"
            >
              Go to Pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-10 text-center shadow-2xl shadow-indigo-900/30">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">See it in action</h2>
          <p className="mt-3 text-base text-indigo-100 sm:text-lg">Start free and collect your first reviews this week with branded share links and QR kits.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-8 py-4 text-sm font-semibold text-indigo-600 shadow-lg shadow-slate-900/25 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-2xl border border-white/60 px-8 py-4 text-sm font-semibold text-white/90 transition hover:bg-slate-900/10"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
