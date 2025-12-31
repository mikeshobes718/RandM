const CONTROLS = [
  {
    title: 'Infrastructure',
    body: 'Hosted on hardened cloud infrastructure with network isolation, automated patching, and continuous monitoring. All data is encrypted in transit (TLS 1.3) and at rest using provider-managed keys.',
  },
  {
    title: 'Application security',
    body: 'Least-privilege access, mandatory MFA for internal tooling, and regular third-party penetration tests. Sensitive credentials live in managed secret stores with automatic rotation.',
  },
  {
    title: 'Compliance & privacy',
    body: 'We follow SOC 2 aligned controls, maintain detailed audit logs, and honor data processing agreements. Customer data never leaves our trusted sub-processors without consent.',
  },
];

export default function SecurityPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-260px] h-[460px] rounded-full bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.2),transparent_60%)] blur-3xl" />
        <div className="absolute right-[-200px] bottom-[-160px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.2),transparent_70%)] blur-3xl" />
      </div>

      <section className="relative px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/95 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-700 shadow-sm shadow-slate-900/5 backdrop-blur">Security</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Security at Reviews & Marketing</h1>
          <p className="mt-4 text-lg text-slate-700">Our platform powers reputations, so we treat every customer record like mission-critical infrastructure.</p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {CONTROLS.map((control) => (
            <div key={control.title} className="premium-card p-8 rounded-3xl flex flex-col h-full">
              <h2 className="text-lg font-bold text-slate-900 mb-4">{control.title}</h2>
              <p className="text-sm text-muted leading-relaxed flex-1">{control.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="premium-card p-8 rounded-3xl bg-brand/5 border-brand/10">
            <p className="text-sm text-slate-700 text-center">
              See something concerning? Email <a href="mailto:security@reviewsandmarketing.com" className="font-bold text-brand hover:underline">security@reviewsandmarketing.com</a>. <br className="hidden sm:block" />
              We respond within one business day and coordinate disclosures responsibly.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
