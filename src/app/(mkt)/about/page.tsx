import Link from "next/link";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/styles";

const HIGHLIGHTS = [
  { value: '2023', label: 'Founded in NYC' },
  { value: 'Cloud', label: 'Modern Infrastructure' },
  { value: '99.9%', label: 'Platform Uptime' },
];

const VALUES = [
  {
    title: 'Clarity over complexity',
    copy: 'Operators deserve software that feels as polished as their front of house. We distill every workflow down to the essentials.'
  },
  {
    title: 'Privacy by default',
    copy: 'From TLS 1.3 transport to least-privilege access, security is baked into our DNA. Your data never leaves our ecosystem.'
  },
  {
    title: 'Measurable outcomes',
    copy: 'Every feature is built with reporting in mind. See exactly how your share links and QR codes are performing in real-time.'
  },
];

const MILESTONES = [
  { year: '2024', text: 'Launched the first smart QR routing system for local businesses.' },
  { year: '2025', text: 'Introduced automated follow-ups and multi-location dashboard controls.' },
  { year: '2026', text: 'Expanding into deeper integrations with Square, Stripe, and Google APIs.' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-8">
            Our Mission
          </div>
          <h1 className="text-balance mb-8">
            We help local operators <br className="hidden md:block" />
            <span className="text-brand">turn delight into proof.</span>
          </h1>
          <p className="text-xl text-muted max-w-3xl mx-auto leading-relaxed">
            Reviews & Marketing was born inside busy service businesses that needed polished tech without the enterprise bloat. We help you collect authentic reviews automatically.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {HIGHLIGHTS.map((item) => (
            <div key={item.label} className="premium-card p-10 rounded-[32px] text-center">
              <div className="text-4xl font-black mb-2">{item.value}</div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start mb-24">
          <div className="space-y-8">
            <h2 className="text-3xl font-black tracking-tight">Why we built it</h2>
            <p className="text-muted leading-relaxed text-lg">
              Our founders spent a decade in hospitality and home services chasing reviews manually. We designed a platform that blends premium branding with deep automation, letting teams focus on the guest experience while the software handles the follow-through.
            </p>
            <div className="pt-4">
              <Link href="/register" className={primaryButtonClass}>
                Join the Journey
              </Link>
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">Our Core Values</h2>
            <div className="space-y-4">
              {VALUES.map((value) => (
                <div key={value.title} className="premium-card p-6 rounded-2xl bg-accent/30 border-dashed">
                  <div className="text-sm font-bold mb-2">{value.title}</div>
                  <p className="text-xs text-muted leading-relaxed">{value.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="premium-card p-10 md:p-16 rounded-[40px] mb-24">
          <h2 className="text-2xl font-black mb-12 text-center">Platform Milestones</h2>
          <div className="max-w-3xl mx-auto space-y-12">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className="flex gap-8 group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-black text-sm z-10 relative">
                    {m.year}
                  </div>
                  {i !== MILESTONES.length - 1 && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-px h-12 bg-border border-dashed"></div>
                  )}
                </div>
                <div className="pt-3">
                  <p className="text-muted leading-relaxed group-hover:text-foreground transition-colors">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="premium-card p-12 md:p-20 rounded-[48px] bg-foreground text-white overflow-hidden relative text-center">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-brand/10 blur-[120px] -z-0"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black mb-6">Ready to see it in action?</h2>
            <p className="text-slate-400 text-lg mb-10">
              Start free and collect your first reviews this week. Our team is ready to help you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="primary-button h-14 px-10 w-full sm:w-auto">
                Get Started Free
              </Link>
              <Link href="/contact" className="secondary-button !bg-white/10 !text-white !border-white/20 h-14 px-10 hover:!bg-white/20 w-full sm:w-auto">
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
