export const dynamic = "force-dynamic";

import Link from "next/link";
import HomeCtaButtons from "../components/HomeCtaButtons";

const heroMetrics = [
  { value: "5 min", label: "Connect & launch", detail: "Add your business and publish your review link in minutes." },
  { value: "5/mo", label: "Starter requests", detail: "Send up to five branded asks every month on the free plan." },
  { value: "All sites", label: "Location coverage", detail: "Track scans, clicks, and ratings across every location." },
  { value: "Live", label: "Feedback timeline", detail: "See new reviews and private feedback as soon as it arrives." },
];

const journeyHighlights = [
  {
    title: "Invite with confidence",
    description: "Use proven email templates to ask for reviews without writing copy from scratch.",
  },
  {
    title: "Share QR codes anywhere",
    description: "Print-ready QR assets send guests straight to your Google review form in one tap.",
  },
  {
    title: "Monitor performance",
    description: "Dashboards visualize scans, clicks, and ratings so every manager knows what’s working.",
  },
  {
    title: "Collaborate as a team",
    description: "Invite teammates, assign owners, and keep feedback organized as you grow.",
  },
];

const capabilities = [
  {
    title: "Review request manager",
    description: "Schedule and send branded review requests—Starter includes five per month, Pro unlocks more.",
    gradient: "from-sky-500 to-indigo-500",
    icon: (
      <path d="M4 7a3 3 0 013-3h3l2 2h4a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "QR code builder",
    description: "Export polished QR posters and table tents that point guests directly to your review link.",
    gradient: "from-emerald-500 to-teal-500",
    icon: (
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Analytics dashboard",
    description: "Measure scans, clicks, and review volume with simple charts—no spreadsheets required.",
    gradient: "from-purple-500 to-fuchsia-500",
    icon: (
      <path d="M5 12l3 3 6-6m4-1v10a2 2 0 01-2 2H8l-4-4V6a2 2 0 012-2h5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Multi-location routing",
    description: "Give each location a tailored landing experience and route customers to the right profile.",
    gradient: "from-amber-400 to-orange-500",
    icon: (
      <path d="M8 7h8M8 12h5m4-7h1a2 2 0 012 2v12l-4-2-4 2-4-2-4 2V7a2 2 0 012-2h1" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Team collaboration",
    description: "Invite teammates, manage roles, and keep everyone aligned from the shared dashboard.",
    gradient: "from-slate-900 to-slate-700",
    icon: (
      <path d="M12 6l6 3-6 3-6-3 6-3zm0 6v6" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "Priority support",
    description: "Pro customers get priority support and onboarding help when it matters most.",
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
    description: "Starter allowance used for this week’s customer thank-you email.",
    metric: "+1 request",
  },
  {
    time: "11:45",
    title: "QR scan captured",
    description: "Front desk placard pointed a guest straight to the Google review form.",
    metric: "New scan",
  },
  {
    time: "14:02",
    title: "Location trend updated",
    description: "Multi-location dashboard refreshed with today’s average rating change.",
    metric: "+0.2★",
  },
  {
    time: "17:36",
    title: "Feedback assigned",
    description: "New private note shared with the team for follow-up.",
    metric: "Owner set",
  },
];

const integrationLogos = [
  "Google Reviews",
  "Square",
  "Stripe",
  "Postmark",
];

const testimonials = [
  {
    name: "Camille Rivera",
    role: "Director of Experience, Beacon Dental",
    quote:
      "The ready-made email templates are a lifesaver. We launched our first requests in minutes and watched real reviews come in that same week.",
  },
  {
    name: "Jordan Blake",
    role: "GM, Skyline Fitness",
    quote:
      "The dashboard keeps every location honest. Scans, clicks, and ratings are right there so managers know when to nudge their teams.",
  },
  {
    name: "Lisa Thompson",
    role: "CEO, Tech Solutions",
    quote:
      "Team invites and priority support let us roll the platform out fast. Our follow-ups finally look and feel like our brand.",
  },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-20 h-[540px] bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.18),transparent_65%)]" />

      {/* Hero */}
      <section className="relative px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pb-24 lg:pt-28">
        <div className="absolute inset-x-0 -top-24 -z-10 flex justify-center">
          <div className="h-[640px] w-[640px] rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 opacity-30 blur-3xl sm:w-[760px]" />
        </div>
        <div className="absolute left-8 top-32 -z-10 hidden h-32 w-32 animate-pulse rounded-full bg-emerald-400/40 blur-2xl lg:block" />

        <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
          <div className="space-y-12">
            <div className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
              Premium release
              <span className="ml-3 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white/90">
                Glow Suite
              </span>
            </div>

            <header className="space-y-6">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Collect more reviews with one connected workspace.
                <span className="block bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  Your links, QR codes, and feedback in one place.
                </span>
              </h1>
              <p className="max-w-2xl text-lg text-slate-200 sm:text-xl">
                Connect your Google review link, send proven email requests, print QR codes, and keep an eye on every location’s results from a single dashboard.
              </p>
            </header>

            <div className="space-y-6">
              <HomeCtaButtons align="start" />
              <p className="text-sm text-slate-100/80">
                Starter is free, and you can upgrade to Pro whenever you’re ready.
              </p>
            </div>

            <dl className="grid gap-6 text-left text-sm sm:grid-cols-2 lg:grid-cols-4">
              {heroMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white/95 to-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur"
                >
                  <dt className="text-xs uppercase tracking-[0.35em] text-slate-500">{metric.label}</dt>
                  <dd className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</dd>
                  <p className="mt-2 text-xs text-slate-600">{metric.detail}</p>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-10 hidden h-32 w-32 rounded-full bg-purple-500/30 blur-3xl lg:block" />
            <div className="absolute -right-10 bottom-0 hidden h-36 w-36 rounded-full bg-sky-500/40 blur-3xl lg:block" />
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/85 p-6 shadow-[0_60px_140px_rgba(15,23,42,0.25)]">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-500">
                <span>Review workspace</span>
                <span className="flex items-center gap-2 text-emerald-500">
                  <span className="flex h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-slate-800">
                    <span>Request queue</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">3 remaining</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    See how many review requests are scheduled this week and when your next send goes out.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-slate-800">
                    <span>QR code</span>
                    <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">Ready</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Download a branded code that routes customers straight to your Google review form.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm text-slate-800">
                    <span>Team follow-ups</span>
                    <span className="flex items-center gap-2 text-xs font-semibold text-amber-600">
                      <span className="flex h-2 w-2 animate-ping rounded-full bg-amber-400" />
                      2 assigned
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Track which teammate owns the latest private feedback so nothing slips through the cracks.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between rounded-3xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-700 shadow-sm">
                <span>Average rating</span>
                <span className="flex items-baseline gap-2 text-2xl font-semibold text-slate-900">
                  4.8
                  <span className="text-xs font-normal text-emerald-600">Across all locations</span>
                </span>
              </div>
            </div>

            {/* Floating callouts temporarily removed */}
          </div>
        </div>
      </section>

      {/* Journey Spotlight */}
      <section className="relative overflow-hidden border-y border-white/5 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-900 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-white/10 via-white/0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-indigo-900/40 via-transparent" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-center">
            <div className="space-y-8">
              <span className="inline-flex items-center rounded-full border border-white/25 bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white">
                Customer journey
              </span>
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">
                  A simple flow from invite to review.
                </h2>
                <p className="text-lg text-slate-100/85">
                  Send a branded email, post a QR code, and track responses in real time—no extra tools or complex setup required.
                </p>
              </div>

              <ul className="grid gap-5 text-sm text-slate-200">
                {journeyHighlights.map((item) => (
                  <li key={item.title} className="flex gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 text-slate-700 shadow-[0_18px_50px_rgba(15,23,42,0.25)]">
                    <span className="mt-1 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white" />
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-slate-600">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  href="/features"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Explore the product features
                  <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-6 right-12 h-28 w-28 rounded-full bg-sky-400/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_60px_160px_rgba(15,23,42,0.25)]">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between text-sm text-slate-800">
                    <div>
                      <p className="font-semibold text-slate-900">Glow-up launch</p>
                      <p className="text-xs text-slate-600">Hospitality · VIP Guests</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Live</span>
                  </div>
                  <div className="mt-6 grid gap-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <span className="uppercase tracking-[0.3em] text-slate-500">Step 01</span>
                      <span>Email request · today</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <span className="uppercase tracking-[0.3em] text-slate-500">Step 02</span>
                      <span>QR follow-up · front desk</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                      <span className="uppercase tracking-[0.3em] text-slate-500">Step 03</span>
                      <span>Team note · assign owner</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Requests this week</span>
                    <span className="text-lg font-semibold text-slate-900">18</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">Includes email sends and QR scans recorded on the dashboard.</p>
                  <div className="mt-4 h-24 w-full rounded-2xl bg-gradient-to-r from-indigo-300/50 via-purple-300/40 to-emerald-300/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="bg-white py-24 text-slate-900 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold sm:text-5xl">Everything you need to invite, track, and respond.</h2>
            <p className="mt-6 text-lg text-slate-600">
              Send review requests, share QR codes, monitor analytics, and collaborate with your team—right from Reviews & Marketing.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {capabilities.map((capability) => (
              <article key={capability.title} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/10 transition hover:-translate-y-1 hover:shadow-2xl">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${capability.gradient} text-white shadow-lg shadow-slate-900/10`}>
                  <svg aria-hidden className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    {capability.icon}
                  </svg>
                </div>
                <h3 className="mt-8 text-xl font-semibold text-slate-900">{capability.title}</h3>
                <p className="mt-4 text-slate-600">{capability.description}</p>
                <div className="absolute -right-16 -top-16 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent blur-2xl transition group-hover:scale-150" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Live feed */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/2 bg-[radial-gradient(circle_at_left,rgba(14,165,233,0.22),transparent_70%)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start lg:px-8">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              Command pulse
            </p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Stay on top of activity as it happens.</h2>
            <p className="text-lg text-slate-300">
              Monitor new reviews, QR scans, and private feedback from the live timeline. Filter by location or teammate in a click.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Peek inside the dashboard
              <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/5 p-8 shadow-[0_50px_140px_rgba(15,23,42,0.55)] backdrop-blur">
            <ol className="space-y-6">
              {timelineEntries.map((entry) => (
                <li key={entry.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/60">
                    <span>{entry.time}</span>
                    <span>{entry.metric}</span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-white">{entry.title}</p>
                  <p className="mt-2 text-sm text-slate-300">{entry.description}</p>
                </li>
              ))}
            </ol>

            <div className="mt-8 grid gap-4 text-sm text-white sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.35em] text-white/60">Today</div>
                <p className="mt-3 text-2xl font-semibold">14 responses</p>
                <p className="mt-1 text-xs text-slate-300">Email sends + QR scans recorded so far</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.35em] text-white/60">Next follow-up</div>
                <p className="mt-3 text-2xl font-semibold">In 2h</p>
                <p className="mt-1 text-xs text-slate-300">Reminder set for pending private feedback</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="border-y border-white/5 bg-slate-950 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Connect your essentials</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Built to work with the tools you already use.</h2>
          </div>
          <div className="mt-12 grid gap-4 text-center text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
            {integrationLogos.map((logo) => (
              <div key={logo} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold tracking-wide text-white/80 shadow-lg shadow-slate-900/30">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold sm:text-5xl">Operators who lead with experience trust Reviews & Marketing.</h2>
            <p className="mt-6 text-lg text-slate-300">
              Hospitality, healthcare, and boutique fitness teams rely on our dashboard to collect reviews and stay in sync.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-slate-900/40 backdrop-blur">
                <div className="flex items-center gap-3 text-amber-300">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <svg key={idx} aria-hidden className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-6 text-slate-100">“{testimonial.quote}”</p>
                <footer className="mt-8 text-sm text-slate-300">
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p>{testimonial.role}</p>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-sky-600 to-purple-600 py-24 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center text-white sm:px-6 lg:px-8">
          <h2 className="text-4xl font-semibold sm:text-5xl">Start collecting more reviews today.</h2>
          <p className="mt-6 text-lg text-blue-100">
            Launch your free Starter account, send your first requests, and see results in the dashboard before you upgrade.
          </p>
          <div className="mt-10">
            <HomeCtaButtons />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-blue-100/70">
            Starter is free • Upgrade when you crave more brilliance
          </p>
        </div>
      </section>
    </main>
  );
}
