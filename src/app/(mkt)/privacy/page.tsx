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
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-8">
            Privacy
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted leading-relaxed max-w-2xl mx-auto">
            Last updated: {new Date().toLocaleDateString()} — We treat your data like mission-critical infrastructure.
          </p>
        </div>

        <div className="space-y-8">
          <div className="surface-card p-8 md:p-10 rounded-[32px]">
            <p className="text-sm text-muted leading-relaxed">
              We take privacy seriously. Reviews & Marketing collects only the data necessary to provide and improve the platform, and we never sell customer information. Below is a summary of how we handle data; for questions, contact <a href="mailto:privacy@reviewsandmarketing.com" className="font-bold text-brand hover:underline">privacy@reviewsandmarketing.com</a>.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {POLICY_SECTIONS.map((section) => (
              <div key={section.title} className="surface-card p-8 rounded-3xl flex flex-col h-full">
                <h2 className="text-lg font-bold text-foreground mb-4">{section.title}</h2>
                <ul className="space-y-3 flex-1">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand/40 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="surface-card p-8 md:p-10 rounded-[32px] bg-accent/30 border-dashed">
            <h2 className="text-lg font-bold text-foreground mb-4">Questions or requests</h2>
            <p className="text-sm text-muted leading-relaxed">
              You can reach our data protection team at <a className="font-bold text-brand hover:underline" href="mailto:privacy@reviewsandmarketing.com">privacy@reviewsandmarketing.com</a>. We honor verified requests to access, correct, or delete personal data within applicable regulations.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
