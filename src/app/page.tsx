export const dynamic = "force-dynamic";

import Link from "next/link";
import HomeCtaButtons from "../components/HomeCtaButtons";
import NewsletterSignup from "../components/NewsletterSignup";

const features = [
  {
    title: "Compliant Review Growth",
    description: "Get more Google reviews the right way. Our smart Review Routing guides happy customers to Google while providing a private channel for concerns.",
    icon: "verified",
  },
  {
    title: "Smart QR Codes",
    description: "Use custom branded QR codes in-store to capture names and contact info instantly.",
    icon: "qr_code_2",
  },
  {
    title: "Reputation Dashboard",
    description: "Monitor your rating, track new reviews, and manage your growing customer database from one simple, connected workspace.",
    icon: "monitoring",
  },
];

const steps = [
  {
    num: "01",
    title: "Connect & Sync",
    text: "Link your Google Profile and sync your customers via POS integration or Excel uploads to instantly organize your database.",
    icon: "sync",
  },
  {
    num: "02",
    title: "Automate Outreach",
    text: "Set up automatic triggers and follow-up sequences. Our system sends the texts and emails so you don't have to lift a finger.",
    icon: "send",
  },
  {
    num: "03",
    title: "Route Feedback",
    text: "Happy customers are guided to Google to share their experience. Those with concerns are routed to a private channel to resolve issues instantly.",
    icon: "call_split",
  },
  {
    num: "04",
    title: "Grow Your Reputation",
    text: "Watch your public rating climb while building a powerful customer database. Use these insights to drive repeat business on autopilot.",
    icon: "trending_up",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen selection:bg-primary/20 overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary text-xs font-semibold mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Reputation toolkit for modern businesses
            </div>

            <h1 className="text-balance mb-6">
              Get more{" "}
              <span className="inline-flex">
                <span style={{ color: "#4285F4" }}>G</span>
                <span style={{ color: "#EA4335" }}>o</span>
                <span style={{ color: "#FBBC05" }}>o</span>
                <span style={{ color: "#4285F4" }}>g</span>
                <span style={{ color: "#34A853" }}>l</span>
                <span style={{ color: "#EA4335" }}>e</span>
              </span>{" "}
              reviews
              <br className="hidden md:block" />
              the <span className="text-primary">compliant way.</span>
            </h1>

            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-5 text-balance leading-relaxed">
              Get more Google reviews the compliant way + recover unhappy customers privately. More reviews, more insights, fewer surprises.
            </p>
            <p className="text-sm text-on-surface-variant/60 mb-10 font-medium">
              We don&apos;t incentivize or gate reviews -- we use smart Review Routing.
            </p>
            <HomeCtaButtons variant="hero" />
          </div>
        </div>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full -z-10 pointer-events-none opacity-[0.04]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,var(--primary),transparent_70%)]" />
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-surface-container-low">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <Link href="/how-it-works" className="group inline-block">
              <h2 className="mb-3 group-hover:text-primary transition-colors flex items-center justify-center gap-2">
                How it works
                <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" style={{ fontSize: 22 }}>arrow_forward</span>
              </h2>
            </Link>
            <p className="text-on-surface-variant">A simple 4-step system designed for busy operators.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-14">
            {steps.map((step) => (
              <div key={step.num} className="surface-card p-6 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{step.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface-variant/40">{step.num}</span>
                </div>
                <h3 className="mb-2 text-base font-bold">{step.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto text-center p-8 surface-card">
            <p className="text-base text-on-surface-variant leading-relaxed italic">
              &quot;We provide customers a direct path to share their experience. Happy customers are guided to Google, while those with concerns can reach you privately to resolve issues instantly.&quot;
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="surface-card p-8 group">
                <div className="w-12 h-12 rounded-xl bg-primary/8 text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{f.icon}</span>
                </div>
                <h3 className="mb-2 text-base font-bold">{f.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-inverse-surface text-inverse-on-surface overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] -z-0" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="material-symbols-outlined text-inverse-primary/40 mb-8 block" style={{ fontSize: 40 }}>format_quote</span>
            <p className="text-xl md:text-2xl font-medium mb-8 leading-relaxed">
              &quot;Our Google rating went from 4.2 to 4.8 in just 3 months. The private feedback channel is a lifesaver -- we finally have a way to hear from customers before they post publicly.&quot;
            </p>
            <div>
              <p className="font-bold">Camille Rivera</p>
              <p className="text-sm text-inverse-on-surface/60">Director of Experience, Beacon Dental</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-5">Ready to improve your reputation?</h2>
          <p className="text-on-surface-variant mb-10 max-w-xl mx-auto">
            Join businesses using Reviews & Marketing to grow their online presence the compliant way.
          </p>
          <div className="flex flex-col items-center gap-5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <HomeCtaButtons variant="hero" />
              <Link
                href="/how-it-works"
                className="secondary-button h-12 px-8 flex items-center gap-2 group"
              >
                See How It Works
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-0.5" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
            </div>
            <p className="text-xs text-on-surface-variant/60">No credit card required &middot; Setup in 5 minutes</p>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-14 bg-surface-container-low">
        <div className="container mx-auto px-6 text-center">
          <p className="text-xs font-semibold mb-3 tracking-wider uppercase text-on-surface-variant/60">Stay Updated</p>
          <h3 className="mb-6">Weekly tips to collect more reviews.</h3>
          <NewsletterSignup variant="inline" />
        </div>
      </section>
    </main>
  );
}
