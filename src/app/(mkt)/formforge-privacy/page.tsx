const SECTIONS = [
  {
    title: 'What FormForge stores',
    body: 'Workouts, training settings, and optional account details so you can train and sync across devices.',
  },
  {
    title: 'Health data',
    body: 'Apple Health data stays on your device unless you connect it. Sleep and heart rate are used only to estimate readiness.',
  },
  {
    title: 'Cloud backups',
    body: 'Cloud backups use your private FormForge account. We do not sell personal training data.',
  },
  {
    title: 'Your controls',
    body: 'Delete your cloud account anytime in Settings. Clear local workouts on this phone anytime. Local data stays under your control.',
  },
  {
    title: 'Contact',
    body: 'Questions: mikeshobes718@gmail.com',
  },
];

export default function FormForgePrivacyPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand">FormForge</p>
          <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
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
