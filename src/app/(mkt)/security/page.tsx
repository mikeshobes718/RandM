const CONTROLS = [
  {
    title: 'Infrastructure',
    body: 'Hosted on hardened cloud infrastructure with network isolation, automated patching, and continuous monitoring. All data is encrypted in transit (TLS 1.3) and at rest using provider-managed keys.',
  },
  {
    title: 'Application security',
    body: 'Least-privilege access, mandatory MFA for internal tooling, and periodic security reviews. Sensitive credentials live in managed secret stores with automatic rotation.',
  },
  {
    title: 'Compliance & privacy',
    body: 'We follow industry-standard security practices, maintain detailed audit logs, and honor data processing agreements. Customer data never leaves our trusted sub-processors without consent.',
  },
];

export default function SecurityPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-8">
            Security
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4">Security at Reviews & Marketing</h1>
          <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Our platform powers reputations, so we treat every customer record like mission-critical infrastructure.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-12">
          {CONTROLS.map((control) => (
            <div key={control.title} className="premium-card p-8 rounded-[32px] flex flex-col h-full transition-transform hover:-translate-y-1">
              <h2 className="text-lg font-black text-foreground mb-4">{control.title}</h2>
              <p className="text-sm text-muted leading-relaxed flex-1">{control.body}</p>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="premium-card p-10 rounded-[40px] bg-brand/5 border-brand/10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-4">See something concerning?</h3>
            <p className="text-sm text-muted leading-relaxed mb-0">
              Email <a href="mailto:security@reviewsandmarketing.com" className="font-black text-brand hover:underline">security@reviewsandmarketing.com</a>. <br className="hidden sm:block" />
              We respond within one business day and coordinate disclosures responsibly.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
// force redeploy - security softening
