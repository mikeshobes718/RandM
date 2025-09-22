const POLICY_SECTIONS = [
  {
    title: 'Data we collect',
    items: [
      'Account details that you provide (name, email, business profile)',
      'Usage analytics that show how the product is performing',
      'Billing information processed securely by Stripe',
    ],
  },
  {
    title: 'How we use data',
    items: [
      'Operate and improve the Reviews & Marketing platform',
      'Provide support, product updates, and critical notifications',
      'Detect, prevent, and investigate abuse or misuse',
    ],
  },
  {
    title: 'Your choices',
    items: [
      'Access, update, or delete your account data on request',
      'Export review and customer information from within the dashboard',
      'Opt out of marketing communications at any time',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-indigo-50 to-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-260px] h-[460px] rounded-full bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.2),transparent_60%)] blur-3xl" />
        <div className="absolute right-[-180px] bottom-[-140px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.2),transparent_70%)] blur-3xl" />
      </div>

      <section className="relative px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-600 shadow-sm shadow-slate-900/5 backdrop-blur">
            Privacy
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-lg text-slate-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
            <p className="text-sm text-slate-600 leading-relaxed">
              We take privacy seriously. Reviews & Marketing collects only the data necessary to provide and improve the platform, and we never sell customer information. Below is a summary of how we handle data; for questions, contact <a href="mailto:privacy@reviewsandmarketing.com" className="font-semibold text-indigo-600 hover:underline">privacy@reviewsandmarketing.com</a>.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {POLICY_SECTIONS.map((section) => (
              <div key={section.title} className="rounded-3xl border border-white/70 bg-white/85 p-7 shadow-lg shadow-slate-900/10 backdrop-blur">
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 leading-relaxed">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-900">Questions or requests</h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              You can reach our data protection team at <a className="font-semibold text-indigo-600 hover:underline" href="mailto:privacy@reviewsandmarketing.com">privacy@reviewsandmarketing.com</a>. We honor verified requests to access, correct, or delete personal data within applicable regulations.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
