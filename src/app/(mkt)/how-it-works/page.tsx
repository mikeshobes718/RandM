import Link from "next/link";
import { AnimatedFlow } from "@/components/AnimatedFlow";

export default function HowItWorks() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-surface">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/3 to-transparent" />
      </div>

      <section className="container mx-auto px-6 pt-28 pb-20 max-w-5xl">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary text-xs font-semibold mb-6">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_circle</span>
            Process Overview
          </div>
          <h1 className="tracking-tight mb-5">
            How Reviews & Marketing Works
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
            A simple, compliant system designed to recover unhappy customers privately and amplify your best experiences.
          </p>
        </div>

        <AnimatedFlow />

        {/* Video */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl bg-surface-container-low">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/y0Jb0wNecfk?autoplay=0&rel=0"
              title="Reviews & Marketing Explainer Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>play_circle</span>
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">Watch the Walkthrough</h4>
                <p className="text-xs text-on-surface-variant">See how we build authentic reputations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Explainer image */}
        <div className="relative mb-20 rounded-2xl overflow-hidden shadow-xl bg-surface-container-low">
          <img
            src="/assets/detailed.png"
            alt="Visual Explainer of how R&M works"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Steps breakdown */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {[
            { num: 1, title: 'Connect', icon: 'link', text: 'Link your Google Profile and POS system in seconds. We generate custom QR codes and enable automatic follow-up texts or emails for every visit.' },
            { num: 2, title: 'Capture', icon: 'smartphone', text: 'Customers scan in-store or receive an automatic text via POS integration. We capture contact info and route them to the perfect feedback experience.' },
            { num: 3, title: 'Route', icon: 'call_split', text: 'Happy customers are guided to Google to share their experience. Those with concerns are routed to a private channel so you can resolve issues before they become public.' },
            { num: 4, title: 'Grow', icon: 'trending_up', text: 'Watch your public rating climb while building a powerful customer database. Use these insights to improve operations and drive repeat business.' },
          ].map((step) => (
            <div key={step.num} className="surface-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary mb-4">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{step.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-2">{step.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="p-10 primary-gradient rounded-2xl text-center text-on-primary relative overflow-hidden">
          <h2 className="text-2xl font-bold text-on-primary mb-5">Ready to start building your reputation?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="h-12 px-8 bg-white text-primary rounded-lg font-semibold text-sm inline-flex items-center justify-center hover:bg-white/90 transition-colors">
              Get Started For Free
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-on-primary/80 hover:text-on-primary transition-colors">
              View Plans & Pricing &rarr;
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
