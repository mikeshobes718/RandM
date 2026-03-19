export const dynamic = "force-dynamic";

import Link from "next/link";
import HomeCtaButtons from "../components/HomeCtaButtons";

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Hero */}
      <section className="relative px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="absolute inset-x-0 top-0 -z-10 flex justify-center">
          <div className="h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 opacity-40 blur-3xl sm:w-[640px]" />
        </div>
        <div className="absolute right-12 bottom-[-160px] -z-10 h-72 w-72 rounded-full bg-indigo-400/40 blur-3xl sm:h-96 sm:w-96" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200/80">
                Fresh release
                <span className="ml-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  v2.4
                </span>
              </div>

              <div>
                <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                  Premium review automation for
                  <span className="block bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                    ambitious teams
                  </span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
                  Launch branded review campaigns in minutes, trigger automated follow-ups, and watch reputation scores climb. Reviews & Marketing keeps every touchpoint polished, personal, and measurable.
                </p>
              </div>

              <div className="space-y-6">
                <HomeCtaButtons align="start" />
                <p className="text-sm text-slate-400">
                  No onboarding fees. Cancel any time. Launch your first campaign today.
                </p>
              </div>

              <dl className="grid max-w-xl grid-cols-2 gap-6 text-left text-sm sm:grid-cols-4 sm:text-center">
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Reviews captured</dt>
                  <dd className="mt-2 text-2xl font-semibold text-white">10K+</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Avg. rating boost</dt>
                  <dd className="mt-2 text-2xl font-semibold text-white">+1.7★</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Campaign setup</dt>
                  <dd className="mt-2 text-2xl font-semibold text-white">5 min</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-500">Customer NPS</dt>
                  <dd className="mt-2 text-2xl font-semibold text-white">74</dd>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/40 via-blue-500/20 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-8 shadow-[0_40px_120px_rgba(15,23,42,0.45)] backdrop-blur">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                  <span>Live campaign</span>
                  <span className="flex items-center gap-2">
                    <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>

                <div className="mt-8 space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-200">
                      <span>Auto follow-up</span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-300">On</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Sends a reminder 48 hours after the first ask to double conversion.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-200">
                      <span>Smart routing</span>
                      <span className="rounded-full bg-sky-500/20 px-2 py-1 text-xs font-semibold text-sky-200">Google</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Detects the best platform per recipient and deep-links straight into the review form.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm text-slate-200">
                      <span>Performance pulse</span>
                      <span className="flex items-center gap-2 text-xs font-semibold text-amber-200">
                        <span className="flex h-2 w-2 animate-pulse rounded-full bg-amber-300" />
                        312 new reviews
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Weekly summary highlighting growth, sentiment trends, and responders to thank.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  <span>Reputation score</span>
                  <span className="flex items-baseline gap-2 text-2xl font-semibold text-white">
                    94
                    <span className="text-xs font-normal text-emerald-300">▲ 8 this month</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand strip */}
      <section className="relative border-t border-white/10 bg-slate-950/60 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs uppercase tracking-[0.35em] text-slate-500">
            Trusted by modern service brands
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 text-center text-sm font-semibold text-slate-400 sm:grid-cols-4 lg:grid-cols-6">
            <div className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-3">Beacon Dental</div>
            <div className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-3">Civic Auto</div>
            <div className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-3">Northside Pediatrics</div>
            <div className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-3">Skyline Fitness</div>
            <div className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-3">Sunset Hospitality</div>
            <div className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-3">FreshCuts Salon</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-24 text-slate-900 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold sm:text-5xl">A polished experience at every step</h2>
            <p className="mt-6 text-lg text-slate-600">
              Design, launch, and optimise review journeys with enterprise-grade tools packaged for growing teams.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white flex items-center justify-center">
                <svg aria-hidden className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M9 8h6M9 12h3m8-3v6a5 5 0 01-5 5H7a5 5 0 01-5-5V9a5 5 0 015-5h5l3.5 3.5L19 9a5 5 0 013 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-8 text-xl font-semibold text-slate-900">Campaign composer</h3>
              <p className="mt-4 text-slate-600">
                Build multi-channel review requests with tailored messaging, QR codes, and shareable links that match your brand voice.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center">
                <svg aria-hidden className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-8 text-xl font-semibold text-slate-900">Automated follow-ups</h3>
              <p className="mt-4 text-slate-600">
                Intelligent reminders via email and SMS that nudge happy customers at the perfect moment and capture more 5★ feedback.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center">
                <svg aria-hidden className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M11 5h2m-1 0v14m-7-5h2m10 0h2M5 9h2m10 0h2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-8 text-xl font-semibold text-slate-900">Insights & sentiment</h3>
              <p className="mt-4 text-slate-600">
                Monitor performance with live analytics, AI-driven sentiment tagging, and alerts that surface trends before they go viral.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center">
                <svg aria-hidden className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M12 6v6l3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-8 text-xl font-semibold text-slate-900">Real-time reputation pulse</h3>
              <p className="mt-4 text-slate-600">
                Receive live alerts whenever new feedback lands, respond instantly, and maintain white-glove experiences at scale.
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center">
                <svg aria-hidden className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M3 7h2l2 12h10l2-12h2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 7V5a3 3 0 016 0v2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="mt-8 text-xl font-semibold text-slate-900">Secure by design</h3>
              <p className="mt-4 text-slate-600">
                Enterprise-grade access controls, audit logs, and compliance tooling keep customer data safe and teams aligned.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Explore the full feature set
              <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-slate-100 py-24 text-slate-900 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold sm:text-4xl">From invite to glowing review in one flow</h2>
              <p className="text-lg text-slate-600">
                Automate the journey without losing the personal touch. Connect your CRM, import contacts, and let the playbook run while your team focuses on delighting customers.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                See plans & pricing
                <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <ol className="space-y-8">
              <li className="relative overflow-hidden rounded-3xl border border-white/60 bg-white p-6 shadow-xl shadow-slate-900/5">
                <span className="absolute -left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">01</span>
                <h3 className="pl-8 text-xl font-semibold text-slate-900">Trigger or import contacts</h3>
                <p className="mt-3 pl-8 text-slate-600">
                  Sync new customers from Stripe, Square, or a CSV upload. Segment by location or service type in seconds.
                </p>
              </li>

              <li className="relative overflow-hidden rounded-3xl border border-white/60 bg-white p-6 shadow-xl shadow-slate-900/5">
                <span className="absolute -left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">02</span>
                <h3 className="pl-8 text-xl font-semibold text-slate-900">Deliver the perfect ask</h3>
                <p className="mt-3 pl-8 text-slate-600">
                  Send branded emails, texts, and QR cards. Smart routing delivers customers straight to your best performing review pages.
                </p>
              </li>

              <li className="relative overflow-hidden rounded-3xl border border-white/60 bg-white p-6 shadow-xl shadow-slate-900/5">
                <span className="absolute -left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">03</span>
                <h3 className="pl-8 text-xl font-semibold text-slate-900">Measure & celebrate growth</h3>
                <p className="mt-3 pl-8 text-slate-600">
                  Watch dashboards update in real time, trigger thank-you automations, and share wins with your team each week.
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-24 sm:py-32">
        <div className="absolute inset-x-0 top-0 -z-10 h-[320px] bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.25),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-[240px] bg-[radial-gradient(circle_at_bottom,rgba(196,181,253,0.25),transparent)]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-semibold sm:text-5xl">Loved by operators who obsess over experience</h2>
            <p className="mt-6 text-lg text-slate-300">
              Local franchises, boutique hospitality, healthcare practices, and automotive leaders grow their reputation with us every day.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-slate-900/40 backdrop-blur">
              <div className="flex items-center gap-3 text-amber-300">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <svg key={`star-1-${idx}`} aria-hidden className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                  </svg>
                ))}
              </div>
              <p className="mt-6 text-slate-100">
                “We switched on Reviews & Marketing and jumped from a 3.2 to 4.8 rating in under three months. The automation keeps our front-of-house team focused on guests, not follow-up scripts.”
              </p>
              <footer className="mt-8 text-sm text-slate-300">
                <p className="font-semibold text-white">Sarah Chen</p>
                Owner, Downtown Diner
              </footer>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-slate-900/40 backdrop-blur">
              <div className="flex items-center gap-3 text-amber-300">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <svg key={`star-2-${idx}`} aria-hidden className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                  </svg>
                ))}
              </div>
              <p className="mt-6 text-slate-100">
                “The QR flows are genius. Guests scan a table tent, tap the review platform we recommend, and we receive a detailed summary every Friday. It’s become a core revenue lever.”
              </p>
              <footer className="mt-8 text-sm text-slate-300">
                <p className="font-semibold text-white">Mike Rodriguez</p>
                Manager, AutoCare Pro
              </footer>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-slate-900/40 backdrop-blur">
              <div className="flex items-center gap-3 text-amber-300">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <svg key={`star-3-${idx}`} aria-hidden className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                  </svg>
                ))}
              </div>
              <p className="mt-6 text-slate-100">
                “Setup took five minutes. Our post-visit emails now feel handcrafted, and the weekly analytics huddle has become everyone’s favourite meeting.”
              </p>
              <footer className="mt-8 text-sm text-slate-300">
                <p className="font-semibold text-white">Lisa Thompson</p>
                <p>CEO, Tech Solutions</p>
              </footer>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-sky-600 to-purple-600 py-24 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center text-white sm:px-6 lg:px-8">
          <h2 className="text-4xl font-semibold sm:text-5xl">Ready to turn happy customers into 5★ advocates?</h2>
          <p className="mt-6 text-lg text-blue-100">
            Join hundreds of operators already accelerating their reputation flywheel with Reviews & Marketing.
          </p>
          <div className="mt-10">
            <HomeCtaButtons />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-blue-100/70">
            Starter is free • Upgrade when you need more horsepower
          </p>
        </div>
      </section>
    </main>
  );
}
