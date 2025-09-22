const TERMS = [
  {
    heading: '1. Agreement',
    body: 'By using Reviews & Marketing you agree to these terms, any referenced policies, and applicable laws. If you represent a business, you confirm you have authority to bind it to this agreement.',
  },
  {
    heading: '2. Accounts and use',
    body: 'You are responsible for safeguarding credentials and ensuring that your use complies with our Acceptable Use commitments. We may suspend access for abuse or security concerns.',
  },
  {
    heading: '3. Subscriptions & billing',
    body: 'Subscriptions are billed through Stripe. Plans renew automatically until cancelled. You can manage or cancel your subscription anytime within the dashboard.',
  },
  {
    heading: '4. Data ownership',
    body: 'You retain ownership of customer data collected through the platform. We process data only to provide the service and as described in our Privacy Policy.',
  },
];

export default function TermsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-indigo-50 to-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-260px] h-[460px] rounded-full bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.2),transparent_60%)] blur-3xl" />
        <div className="absolute left-[-200px] bottom-[-140px] h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.2),transparent_70%)] blur-3xl" />
      </div>

      <section className="relative px-4 pt-24 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-600 shadow-sm shadow-slate-900/5 backdrop-blur">
            Terms
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Terms of Service</h1>
          <p className="mt-4 text-lg text-slate-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {TERMS.map(({ heading, body }) => (
            <div key={heading} className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">{heading}</h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}
          <div className="rounded-3xl border border-white/70 bg-white/85 p-8 text-sm text-slate-600 shadow-lg shadow-slate-900/10 backdrop-blur">
            For enterprise terms or questions email <a className="font-semibold text-indigo-600 hover:underline" href="mailto:legal@reviewsandmarketing.com">legal@reviewsandmarketing.com</a>.
          </div>
        </div>
      </section>
    </main>
  );
}
