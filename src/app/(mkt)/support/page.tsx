const FAQS = [
  {
    q: "Where do I manage my Google Place ID?",
    a: "Head to Dashboard → Settings. Our lookup tool searches Google Places and saves the ID instantly for every location.",
  },
  {
    q: "QR codes aren’t scanning on older phones—what should I change?",
    a: "Increase contrast using the dark mode option and print at least four inches wide at 300 DPI. Table tent templates inside the QR library already meet those specs.",
  },
  {
    q: "Stripe checkout isn’t redirecting back to the app.",
    a: "Verify your production redirect is set to https://reviewsandmarketing.com/api/integrations/square/oauth/callback and rerun the flow. Our team can confirm in minutes.",
  },
];

export default function SupportPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-260px] h-[480px] rounded-full bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.2),transparent_60%)] blur-3xl" />
        <div className="absolute right-[-180px] bottom-[-120px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.2),transparent_70%)] blur-3xl" />
      </div>

      <section className="relative px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-slate-900/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-300 shadow-sm shadow-slate-900/5 backdrop-blur">Support</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">We’re here for every review cycle</h1>
          <p className="mt-4 text-lg text-slate-300 md:text-xl">Access live specialists, deep documentation, and guided playbooks whenever you need them.</p>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/70 bg-slate-900/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
            <h2 className="text-2xl font-semibold text-white">Get in touch</h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">Prefer email? Reach our specialists at <a href="mailto:support@reviewsandmarketing.com" className="font-semibold text-indigo-600 hover:underline">support@reviewsandmarketing.com</a>. We respond within one business day.</p>
            <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200/80 bg-slate-900/80 p-5 text-sm text-slate-300 shadow-inner">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Sales</div>
                <a href="mailto:sales@reviewsandmarketing.com" className="mt-1 block font-medium text-white hover:text-indigo-600">sales@reviewsandmarketing.com</a>
                <p className="text-xs text-slate-500">Strategy consults, demos, custom onboarding</p>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Support</div>
                <a href="mailto:support@reviewsandmarketing.com" className="mt-1 block font-medium text-white hover:text-indigo-600">support@reviewsandmarketing.com</a>
                <p className="text-xs text-slate-500">Mon–Fri, 9a–6p ET • Same-day responses</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-500/15 via-indigo-500/5 to-transparent p-5 text-sm text-slate-200 shadow-lg shadow-indigo-500/20">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Live demo</div>
              <p className="mt-2">Want a walkthrough tailored to your industry? We’ll assemble the right onboarding specialist.</p>
              <a href="mailto:sales@reviewsandmarketing.com?subject=Demo%20request" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                Request a demo
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" /></svg>
              </a>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-900/80 p-4 text-xs text-slate-500 shadow-inner">
              <div className="font-semibold text-slate-300">Status</div>
              <p className="mt-1">All systems operational. View live metrics at <a href="https://status.reviewsandmarketing.com" className="text-indigo-600 hover:underline">status.reviewsandmarketing.com</a>.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-slate-900/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
            <h2 className="text-2xl font-semibold text-white">Frequently asked</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group py-4">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-sm font-semibold text-white">
                    {faq.q}
                    <span className="text-slate-400 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
