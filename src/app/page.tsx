export const dynamic = "force-dynamic";

import Link from "next/link";
import HomeCtaButtons from "../components/HomeCtaButtons";
import NewsletterSignup from "../components/NewsletterSignup";

const heroMetrics = [
  { value: "5 min", label: "Setup time", detail: "Connect your business and start collecting reviews in minutes." },
  { value: "3x", label: "More reviews", detail: "Businesses using our system collect 3x more Google reviews on average.", badge: "Proven" },
  { value: "Free", label: "Starter plan", detail: "Send 5 branded review requests monthly—no credit card required.", badge: "Always free" },
  { value: "Live", label: "Real-time tracking", detail: "Watch reviews and feedback arrive instantly in your dashboard." },
];

const journeyHighlights = [
  {
    number: "1",
    title: "Send branded review requests",
    description: "Turn happy customers into Google reviews with proven email templates that actually work.",
  },
  {
    number: "2",
    title: "Print QR codes everywhere",
    description: "Place professional QR codes at tables, counters, and exits to capture reviews on the spot.",
  },
  {
    number: "3",
    title: "Watch your rating climb",
    description: "See reviews arrive in real-time and watch your Google rating improve week by week.",
  },
  {
    number: "4",
    title: "Turn feedback into action",
    description: "Get private feedback from unhappy customers before they post negative reviews publicly.",
  },
];

const capabilities = [
  {
    title: "Turn happy customers into reviews",
    description: "Send branded emails that convert satisfied customers into 5-star Google reviews automatically.",
    gradient: "from-sky-500 to-indigo-500",
    icon: (
      <path d="M4 7a3 3 0 013-3h3l2 2h4a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Capture reviews on the spot",
    description: "Print QR codes that let customers leave reviews instantly—no apps or complicated steps required.",
    gradient: "from-emerald-500 to-teal-500",
    icon: (
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "See your reputation improve",
    description: "Watch your Google rating climb as reviews arrive in real-time with clear, actionable insights.",
    gradient: "from-purple-500 to-fuchsia-500",
    icon: (
      <path d="M5 12l3 3 6-6m4-1v10a2 2 0 01-2 2H8l-4-4V6a2 2 0 012-2h5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Stop negative reviews before they happen",
    description: "Get private feedback from unhappy customers so you can fix issues before they go public.",
    gradient: "from-amber-400 to-orange-500",
    icon: (
      <path d="M8 7h8M8 12h5m4-7h1a2 2 0 012 2v12l-4-2-4 2-4-2-4 2V7a2 2 0 012-2h1" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Scale across all locations",
    description: "Manage multiple locations from one dashboard and ensure consistent review collection everywhere.",
    gradient: "from-slate-900 to-slate-700",
    icon: (
      <path d="M12 6l6 3-6 3-6-3 6-3zm0 6v6" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Get expert support when you need it",
    description: "Pro customers get priority support and proven strategies to maximize review collection.",
    gradient: "from-rose-500 to-violet-500",
    icon: (
      <path d="M4 6h16M4 10h10m-6 4h12m-9 4h5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

const timelineEntries = [
  {
    time: "08:10",
    title: "Review request sent",
    description: "Branded email delivered to customer with direct link to Google review page.",
    metric: "Email sent",
    tooltip: "Automated review request from your custom template",
  },
  {
    time: "11:45",
    title: "QR scan captured",
    description: "Guest scanned front desk QR code and was routed to your review form.",
    metric: "QR scan",
    tooltip: "Physical QR code scan tracked in real-time",
  },
  {
    time: "14:02",
    title: "Location trend updated",
    description: "Multi-location dashboard refreshed with today's average rating change.",
    metric: "+0.2★",
    tooltip: "Rating improvement across all tracked locations",
  },
  {
    time: "17:36",
    title: "Feedback assigned to team",
    description: "Private customer note shared with team member for follow-up action.",
    metric: "Assigned",
    tooltip: "Feedback ownership set for accountability",
  },
];

const integrationLogos = [
  { name: "Google Reviews", logo: "🔍" },
  { name: "Square", logo: "⬜" },
  { name: "Stripe", logo: "💳" },
  { name: "Postmark", logo: "📧" },
];

const businessLogos = [
  { name: "Beacon Dental", industry: "Healthcare" },
  { name: "Skyline Fitness", industry: "Fitness" },
  { name: "Tech Solutions", industry: "Technology" },
  { name: "Boutique Hotel", industry: "Hospitality" },
  { name: "Local Restaurant", industry: "Food & Beverage" },
  { name: "Wellness Center", industry: "Wellness" },
];

const testimonials = [
  {
    name: "Camille Rivera",
    role: "Director of Experience, Beacon Dental",
    quote:
      "Our Google rating went from 4.2 to 4.8 in just 3 months. The email templates work like magic—customers actually want to leave reviews now.",
    rating: 5,
  },
  {
    name: "Jordan Blake",
    role: "GM, Skyline Fitness",
    quote:
      "We're collecting 5x more reviews than before. The QR codes at our front desk are constantly being scanned—it's incredible.",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "CEO, Tech Solutions",
    quote:
      "The private feedback feature saved us from 3 negative reviews this month alone. We can fix issues before they go public.",
    rating: 5,
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-20 h-[540px] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.12),transparent_70%)]" />

      {/* Quick Navigation - Anchor Links */}
      <nav className="sticky top-20 z-40 border-b border-indigo-100 bg-white/80 backdrop-blur-md hidden md:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-8 py-3 text-sm font-medium text-slate-700">
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#journey" className="hover:text-indigo-600 transition">How It Works</a>
            <a href="#dashboard" className="hover:text-indigo-600 transition">Live Dashboard</a>
            <a href="#testimonials" className="hover:text-indigo-600 transition">Testimonials</a>
            <a href="#pricing" className="hover:text-indigo-600 transition">Pricing</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" className="relative px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pb-24 lg:pt-28">
        <div className="absolute inset-x-0 -top-24 -z-10 flex justify-center">
          <div className="h-[640px] w-[640px] rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-purple-400 opacity-25 blur-3xl sm:w-[760px]" />
        </div>
        <div className="absolute left-8 top-32 -z-10 hidden h-32 w-32 animate-pulse rounded-full bg-emerald-400/30 blur-2xl lg:block" />

        <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:items-center">
          <div className="space-y-10">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-3 rounded-full border border-indigo-200 bg-indigo-100 px-5 py-2 text-xs font-semibold text-indigo-700">
              <svg className="h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="uppercase tracking-[0.3em]">Trusted by businesses worldwide</span>
            </div>

            <header className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Turn one 5★ experience into five Google reviews
              </h1>
              <p className="max-w-2xl text-xl text-slate-700 sm:text-2xl font-medium">
                The fastest way to collect more reviews and boost your online reputation.
              </p>
              <p className="max-w-2xl text-lg text-slate-600">
                Send branded review requests, print QR codes, and watch your rating climb—all from one simple dashboard.
              </p>
            </header>

            <div className="space-y-4">
              <HomeCtaButtons align="start" variant="hero" />
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free Starter plan • No credit card • Upgrade anytime
              </p>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative">
            <div className="absolute -left-10 top-10 hidden h-32 w-32 rounded-full bg-purple-500/20 blur-3xl lg:block" />
            <div className="absolute -right-10 bottom-0 hidden h-36 w-36 rounded-full bg-sky-500/30 blur-3xl lg:block" />
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_60px_160px_rgba(15,23,42,0.3)] backdrop-blur">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-500">
                <span>Dashboard Preview</span>
                <span className="flex items-center gap-2 text-emerald-600 font-semibold">
                  <span className="flex h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm hover:shadow-md transition group">
                  <div className="flex items-center justify-between text-sm text-slate-800">
                    <span className="font-medium">Review requests</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      3 remaining this week
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-600">
                    Track remaining request allowance and schedule automated follow-ups
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm hover:shadow-md transition group">
                  <div className="flex items-center justify-between text-sm text-slate-800">
                    <span className="font-medium">QR code generator</span>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      Ready to print
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-600">
                    Export branded codes that route customers to your Google review page
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm hover:shadow-md transition group">
                  <div className="flex items-center justify-between text-sm text-slate-800">
                    <span className="font-medium">Team assignments</span>
                    <span className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                      <span className="flex h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                      2 pending responses
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-600">
                    Assign feedback to teammates for follow-up—nothing slips through
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between rounded-3xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 text-sm shadow-sm">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Average rating</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900">4.8</span>
                    <span className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                        </svg>
                      ))}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-emerald-700 font-semibold">
                  ↗ Across all locations
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="relative bg-white py-16 border-y border-indigo-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-indigo-700">
              Simple, transparent pricing
            </span>
            <h2 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl">Choose your plan</h2>
            <p className="mt-4 text-lg text-slate-600">Start free and upgrade when you need more</p>
          </div>

          <dl className="grid gap-4 sm:gap-6 text-left sm:grid-cols-2 lg:grid-cols-4">
            {heroMetrics.map((metric) => (
              <div
                key={metric.label}
                className="relative rounded-2xl sm:rounded-3xl border-2 border-slate-200/80 bg-gradient-to-br from-white via-white/95 to-slate-50/90 p-4 sm:p-6 shadow-xl hover:shadow-2xl transition hover:-translate-y-1"
              >
                {metric.badge && (
                  <div className="absolute -top-2 sm:-top-3 right-3 sm:right-4 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-2 sm:px-3 py-1 text-xs font-bold text-white shadow-lg">
                    {metric.badge}
                  </div>
                )}
                <dt className="text-xs uppercase tracking-[0.35em] text-slate-500 font-semibold">{metric.label}</dt>
                <dd className="mt-2 sm:mt-3 text-3xl sm:text-4xl font-bold text-slate-900">{metric.value}</dd>
                <p className="mt-2 sm:mt-3 text-sm text-slate-600 leading-relaxed">{metric.detail}</p>
              </div>
            ))}
          </dl>

          <div className="mt-12 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition transform hover:scale-105"
            >
              View full pricing details
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Journey Spotlight - Numbered Steps */}
      <section id="journey" className="relative overflow-hidden border-y border-indigo-100 bg-white py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-indigo-50/50 via-white/0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-purple-50/40 via-transparent" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-indigo-700">
              Customer journey
            </span>
            <h2 className="mt-6 text-4xl font-bold text-slate-900 sm:text-5xl">
              A simple flow from invite to review
            </h2>
            <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto">
              Send a branded email, post a QR code, and track responses in real time—no extra tools or complex setup required.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {journeyHighlights.map((item, index) => (
              <div key={item.title} className="relative">
                {/* Connection line for desktop */}
                {index < journeyHighlights.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-indigo-300 to-transparent -z-10" />
                )}
                <div className="group rounded-3xl border-2 border-slate-200/70 bg-white p-6 shadow-lg hover:shadow-2xl transition hover:-translate-y-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xl font-bold shadow-lg">
                      {item.number}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-white px-8 py-3 text-sm font-semibold text-indigo-700 shadow-md hover:bg-indigo-50 transition"
            >
              Explore all product features
              <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="features" className="bg-gradient-to-b from-white to-indigo-50/30 py-24 text-slate-900 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl">Everything you need to invite, track, and respond</h2>
            <p className="mt-6 text-xl text-slate-600">
              Send review requests, share QR codes, monitor analytics, and collaborate with your team—all from Reviews & Marketing.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map((capability) => (
              <article key={capability.title} className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-xl transition hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-300">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${capability.gradient} text-white shadow-lg`}>
                  <svg aria-hidden className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    {capability.icon}
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">{capability.title}</h3>
                <p className="mt-4 text-slate-600 leading-relaxed">{capability.description}</p>
                <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent blur-2xl transition group-hover:scale-150" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Live Dashboard Feed with Tooltips */}
      <section id="dashboard" className="relative overflow-hidden bg-white py-24 sm:py-32 border-t border-indigo-100">
        <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/2 bg-[radial-gradient(circle_at_left,rgba(99,102,241,0.10),transparent_75%)]" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-indigo-700">
              Command pulse
            </span>
            <h2 className="mt-6 text-4xl font-bold text-slate-900 sm:text-5xl">Stay on top of activity as it happens</h2>
            <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto">
              Monitor new reviews, QR scans, and private feedback from the live timeline. Filter by location or teammate in one click.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border-2 border-slate-200 bg-white/95 p-8 shadow-[0_60px_180px_rgba(99,102,241,0.25)] backdrop-blur mb-12">
            <ol className="space-y-6">
              {timelineEntries.map((entry) => (
                <li key={entry.title} className="group rounded-3xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white p-6 hover:shadow-lg hover:border-indigo-200 transition">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-500 font-semibold mb-3">
                    <span>{entry.time}</span>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">{entry.metric}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 mb-2">{entry.title}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{entry.description}</p>
                  {entry.tooltip && (
                    <p className="mt-3 text-xs text-slate-500 italic border-l-2 border-indigo-200 pl-3">
                      💡 {entry.tooltip}
                    </p>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6">
                <div className="text-xs uppercase tracking-[0.35em] text-slate-500 font-semibold">Today's activity</div>
                <p className="mt-3 text-3xl font-bold text-slate-900">14 responses</p>
                <p className="mt-2 text-sm text-slate-600">Email sends + QR scans recorded so far</p>
              </div>
              <div className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
                <div className="text-xs uppercase tracking-[0.35em] text-slate-500 font-semibold">Next follow-up</div>
                <p className="mt-3 text-3xl font-bold text-slate-900">In 2h</p>
                <p className="mt-2 text-sm text-slate-600">Reminder set for pending private feedback</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition transform hover:scale-105"
            >
              Open dashboard
              <svg aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <p className="mt-4 text-sm text-slate-600">Try it yourself • No credit card required</p>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="border-y border-indigo-100 bg-gradient-to-b from-white to-indigo-50/30 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500 font-semibold">Connect your essentials</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Built to work with the tools you already use</h2>
          </div>
          <div className="grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-4">
            {integrationLogos.map((integration) => (
              <div key={integration.name} className="group rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 font-bold tracking-wide text-slate-800 shadow-lg hover:shadow-xl hover:border-indigo-300 transition transform hover:scale-105">
                <div className="text-2xl mb-2">{integration.logo}</div>
                <div className="text-sm">{integration.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Logos */}
      <section className="border-y border-indigo-100 bg-gradient-to-b from-indigo-50/30 to-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500 font-semibold">Trusted by businesses like yours</p>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Join 500+ businesses already collecting more reviews</h2>
          </div>
          <div className="grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {businessLogos.map((business) => (
              <div key={business.name} className="group rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition">
                <div className="text-sm font-semibold text-slate-800">{business.name}</div>
                <div className="text-xs text-slate-500">{business.industry}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof - Testimonials */}
      <section id="testimonials" className="bg-gradient-to-b from-indigo-50/50 via-white to-purple-50/50 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl">Operators who lead with experience trust Reviews & Marketing</h2>
            <p className="mt-6 text-xl text-slate-700">
              Hospitality, healthcare, and boutique fitness teams rely on our dashboard to collect reviews and stay in sync.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 mb-12">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="group rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-xl hover:shadow-2xl hover:border-indigo-300 transition hover:-translate-y-1 backdrop-blur">
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, idx) => (
                    <svg key={idx} aria-hidden className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                    </svg>
                  ))}
                </div>
                <p className="text-lg text-slate-900 leading-relaxed mb-6">"{testimonial.quote}"</p>
                <footer className="text-sm border-t border-slate-200 pt-4">
                  <p className="font-bold text-slate-900">{testimonial.name}</p>
                  <p className="text-slate-600">{testimonial.role}</p>
                </footer>
              </article>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-6 rounded-2xl border-2 border-indigo-200 bg-white px-8 py-4 shadow-lg">
              <div>
                <div className="text-3xl font-bold text-slate-900">4.8/5</div>
                <div className="text-sm text-slate-600">Average rating</div>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div>
                <div className="text-3xl font-bold text-slate-900">500+</div>
                <div className="text-sm text-slate-600">Active businesses</div>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div>
                <div className="text-3xl font-bold text-slate-900">15K+</div>
                <div className="text-sm text-slate-600">Reviews collected</div>
              </div>
              <div className="h-12 w-px bg-slate-200" />
              <div>
                <div className="text-3xl font-bold text-slate-900">3x</div>
                <div className="text-sm text-slate-600">More reviews vs. before</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="relative overflow-hidden bg-white py-20 border-y border-indigo-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl mb-4">
            Get review collection tips delivered to your inbox
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Join 500+ business owners getting monthly strategies, proven templates, and exclusive offers. No spam, unsubscribe anytime.
          </p>
          <NewsletterSignup variant="inline" />
        </div>
      </section>

      {/* Final CTA with reduced contrast */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 py-24 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center text-white sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold sm:text-5xl">Start collecting more reviews today</h2>
          <p className="mt-6 text-xl text-indigo-50">
            Launch your free Starter account, send your first requests, and see results in the dashboard before you upgrade.
          </p>
          <div className="mt-10">
            <HomeCtaButtons variant="full" />
          </div>
          <p className="mt-8 flex items-center justify-center gap-8 text-sm text-indigo-100">
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free forever starter plan
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Setup in 5 minutes
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}