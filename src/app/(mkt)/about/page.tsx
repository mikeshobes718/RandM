import Link from "next/link";

const HIGHLIGHTS = [
  { value: '2023', label: 'Year founded' },
  { value: 'SaaS', label: 'Modern cloud platform' },
  { value: '24/7', label: 'Platform availability' },
];

const VALUES = [
  {
    title: 'Clarity over complexity',
    copy: 'Operators deserve software that feels as polished as their front of house. Every workflow is distilled down to the essentials so your team can execute quickly.'
  },
  {
    title: 'Privacy and trust by default',
    copy: 'From TLS 1.3 transport to least-privilege access, security is baked into our platform and processes. Review journeys stay on your brand domain.'
  },
  {
    title: 'Measurable outcomes',
    copy: 'Every feature carries analytics and reporting hooks so you can see exactly how share links, QR placements, and teammates perform.'
  },
];

const MILESTONES = [
  { year: '2023', text: 'Launched the first QR-to-review toolkit with realtime analytics.' },
  { year: '2024', text: 'Introduced automated follow-ups and multi-location brand controls.' },
  { year: '2025', text: 'Expanding platform capabilities with enhanced analytics and integrations.' },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-280px] h-[520px] rounded-full bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.2),transparent_60%)] blur-3xl" />
        <div className="absolute left-[-180px] top-1/3 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.2),transparent_70%)] blur-3xl" />
        <div className="absolute right-[-220px] bottom-[-140px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18),transparent_75%)] blur-3xl" />
      </div>

      <section className="relative px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-indigo-700 shadow-sm shadow-slate-900/5 backdrop-blur">Our story</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">We help local operators turn delight into proof</h1>
          <p className="mt-5 text-lg text-slate-700 md:text-xl">
            Reviews & Marketing was born inside busy service businesses that needed polished tech without the enterprise bloat. We're on a mission to help businesses of all sizes collect authentic reviews.
          </p>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-lg shadow-slate-900/10 backdrop-blur">
              <div className="text-3xl font-semibold text-slate-900 sm:text-4xl">{item.value}</div>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
            <h2 className="text-2xl font-semibold text-slate-900">Why we built it</h2>
            <p className="mt-4 text-sm text-slate-700 leading-relaxed">
              Our founders spent a decade in hospitality and home services chasing reviews manually. We designed a platform that blends premium branding with deep automation, letting teams focus on the guest experience while the software handles the follow-through.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
            <h2 className="text-2xl font-semibold text-slate-900">What guides us</h2>
            <div className="mt-4 space-y-4">
              {VALUES.map((value) => (
                <div key={value.title} className="rounded-2xl bg-slate-50 p-4 shadow-inner">
                  <div className="text-sm font-semibold text-slate-900">{value.title}</div>
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed">{value.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
          <h2 className="text-2xl font-semibold text-slate-900">Milestones</h2>
          <div className="mt-6 space-y-6">
            {MILESTONES.map((milestone) => (
              <div key={milestone.year} className="flex items-start gap-4">
                <div className="rounded-full border border-indigo-200/80 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">
                  {milestone.year}
                </div>
                <p className="flex-1 text-sm text-slate-700 leading-relaxed">{milestone.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-10 text-white shadow-2xl shadow-indigo-900/30">
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to see it in action?</h2>
            <p className="mt-3 text-base text-indigo-100 sm:text-lg">Start free and collect your first reviews this week—our team will walk you through onboarding.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-sm font-semibold text-indigo-600 shadow-lg shadow-slate-900/25 transition hover:-translate-y-0.5 hover:bg-indigo-50">
                Get Started Free
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-2xl border-2 border-white/80 px-8 py-4 text-sm font-semibold text-white transition hover:bg-white/10">
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
