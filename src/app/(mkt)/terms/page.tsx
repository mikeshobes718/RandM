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
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-8">
            Legal
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4">Terms of Service</h1>
          <p className="text-muted leading-relaxed">
            Last updated: {new Date().toLocaleDateString()} — Clear rules for a better platform.
          </p>
        </div>

        <div className="space-y-6">
          {TERMS.map(({ heading, body }) => (
            <div key={heading} className="surface-card p-8 rounded-3xl">
              <h2 className="text-lg font-bold text-foreground mb-3">{heading}</h2>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </div>
          ))}
          <div className="surface-card p-8 rounded-3xl bg-accent/30 border-dashed text-center">
            <p className="text-sm text-muted">
              For enterprise terms or legal questions, please email <a className="font-bold text-brand hover:underline" href="mailto:legal@reviewsandmarketing.com">legal@reviewsandmarketing.com</a>.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
