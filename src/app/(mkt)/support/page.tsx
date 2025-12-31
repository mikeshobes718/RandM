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
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-8">
            Support
          </div>
          <h1 className="text-balance mb-6">
            We’re here for every <br className="hidden md:block" />
            <span className="text-brand">review cycle.</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Access live specialists, deep documentation, and guided playbooks whenever you need them.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <div className="premium-card p-8 md:p-10 rounded-[32px]">
              <h2 className="text-2xl font-black mb-6">Frequently asked</h2>
              <div className="divide-y divide-border/50">
                {FAQS.map((faq) => (
                  <details key={faq.q} className="group py-6 first:pt-0 last:pb-0">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-bold text-foreground">
                      {faq.q}
                      <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center group-open:rotate-45 transition-transform shrink-0">
                        <span className="text-lg leading-none">+</span>
                      </div>
                    </summary>
                    <div className="mt-4 text-sm text-muted leading-relaxed max-w-xl">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="premium-card p-8 rounded-[32px] bg-accent/30 border-dashed">
              <h2 className="text-lg font-bold mb-6">Get in touch</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Support</div>
                    <a href="mailto:support@reviewsandmarketing.com" className="text-sm font-bold text-brand hover:underline">support@reviewsandmarketing.com</a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Sales</div>
                    <a href="mailto:sales@reviewsandmarketing.com" className="text-sm font-bold text-emerald-600 hover:underline">sales@reviewsandmarketing.com</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-brand/5 rounded-[32px] border border-brand/10">
              <h2 className="text-lg font-bold text-brand mb-4">Live Demo</h2>
              <p className="text-sm text-brand/80 leading-relaxed mb-6">
                Want a walkthrough tailored to your industry? We’ll assemble the right onboarding specialist for your needs.
              </p>
              <a href="mailto:sales@reviewsandmarketing.com?subject=Demo%20Request" className="text-sm font-black text-brand hover:underline inline-flex items-center gap-2">
                Request a Demo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </a>
            </div>

            <div className="px-8 py-4 bg-accent rounded-full border border-border flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">System Status</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-tight">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
