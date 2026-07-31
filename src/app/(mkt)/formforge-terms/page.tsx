const SECTIONS = [
  {
    title: 'Not medical advice',
    body: 'FormForge is a training companion. Talk with a clinician before starting a new program if you have health concerns.',
  },
  {
    title: 'Train safely',
    body: 'You are responsible for safe form, load selection, and rest. Stop if something feels wrong.',
  },
  {
    title: 'Accounts',
    body: 'Accounts are for personal use. Do not share passwords or abuse the service.',
  },
  {
    title: 'Updates',
    body: 'We may update these terms as the app grows. Continued use means you accept the latest version.',
  },
];

export default function FormForgeTermsPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand">FormForge</p>
          <h1 className="text-4xl font-black tracking-tight">Terms of Use</h1>
          <p className="text-muted">Updated July 2026</p>
        </div>
        {SECTIONS.map((section) => (
          <section key={section.title} className="surface-card p-8 rounded-3xl space-y-3">
            <h2 className="text-lg font-bold">{section.title}</h2>
            <p className="text-sm text-muted leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
