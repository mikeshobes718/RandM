export const dynamic = "force-dynamic";

import Link from "next/link";
import HomeCtaButtons from "../components/HomeCtaButtons";
import NewsletterSignup from "../components/NewsletterSignup";

const features = [
  {
    title: "Compliant Review Growth",
    description: "Get more Google reviews the right way. We help happy customers share their experiences while giving you a private channel for feedback.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h5m4 7h1a2 2 0 012-2v12l-4-2-4 2-4-2-4 2V7a2 2 0 012-2h1" />
    )
  },
  {
    title: "Smart QR Codes",
    description: "Custom branded QR codes for your physical location that track every scan in real-time.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    )
  },
  {
    title: "Reputation Dashboard",
    description: "Monitor your rating, track new reviews, and organize customer leads from one place.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    )
  }
];

const steps = [
  {
    num: "01",
    title: "Connect your business",
    text: "Link your Google Profile and POS system in seconds. We generate custom QR codes and enable automatic follow-up texts or emails for every visit."
  },
  {
    num: "02",
    title: "Capture customer data",
    text: "Customers scan in-store or receive an automatic text via POS integration. We capture contact info and route them to the perfect feedback experience."
  },
  {
    num: "03",
    title: "Route feedback intelligently",
    text: "Happy customers are guided to Google to share their experience. Those with concerns are routed to a private channel so you can resolve issues before they become public."
  },
  {
    num: "04",
    title: "Grow your reputation",
    text: "Watch your public rating climb while building a powerful customer database. Use these insights to improve operations and drive repeat business."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen selection:bg-brand/20">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-xs font-semibold mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
              </span>
              REPUTATION TOOLKIT FOR MODERN BUSINESSES
            </div>
            <h1 className="text-balance mb-8">
              Get more <span className="inline-flex">
                <span style={{ color: '#4285F4' }}>G</span>
                <span style={{ color: '#EA4335' }}>o</span>
                <span style={{ color: '#FBBC05' }}>o</span>
                <span style={{ color: '#4285F4' }}>g</span>
                <span style={{ color: '#34A853' }}>l</span>
                <span style={{ color: '#EA4335' }}>e</span>
              </span> reviews <br className="hidden md:block" />
              the <span className="text-brand">compliant way.</span>
            </h1>
            <p className="text-xl text-muted max-w-2xl mx-auto mb-6 text-balance leading-relaxed">
              Get more Google reviews the compliant way + recover unhappy customers privately. More reviews, more insights, fewer surprises.
            </p>
            <p className="text-sm text-slate-400 mb-10 font-medium">
              We don’t incentivize or gate reviews—we use smart Review Routing.
            </p>
            <HomeCtaButtons variant="hero" />
          </div>
        </div>
        
        {/* Subtle background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 pointer-events-none opacity-[0.03]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,var(--brand),transparent_70%)]"></div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 bg-accent/50 border-y border-[#e2e8f0]">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <Link href="/how-it-works" className="group inline-block">
              <h2 className="mb-4 group-hover:text-brand transition-colors flex items-center justify-center gap-3">
                How it works
                <svg className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </h2>
            </Link>
            <p className="text-muted">A simple 4-step system designed for busy operators.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-6xl mx-auto mb-16">
            {steps.map((step) => (
              <div key={step.num} className="relative group">
                <div className="text-5xl font-black text-brand/10 mb-4 group-hover:text-brand/20 transition-colors">{step.num}</div>
                <h3 className="mb-3 text-lg">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="max-w-3xl mx-auto text-center p-8 bg-white/50 rounded-[32px] border border-brand/10 shadow-sm">
            <p className="text-lg text-slate-600 leading-relaxed italic">
              "We provide customers a direct path to share their experience. Happy customers are guided to Google, while those with concerns can reach you privately to resolve issues instantly."
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="premium-card p-8 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-6">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mb-3 text-lg font-bold">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 bg-foreground text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand/5 blur-[120px] -z-0"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <svg className="w-12 h-12 text-brand mx-auto mb-8 opacity-50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L21.017 3V15C21.017 18.3137 18.3307 21 15.017 21H14.017ZM3.0166 21L3.0166 18C3.0166 16.8954 3.91203 16 5.0166 16H8.0166C8.56888 16 9.0166 15.5523 9.0166 15V9C9.0166 8.44772 8.56888 8 8.0166 8H5.0166C3.91203 8 3.0166 7.10457 3.0166 6V3L10.0166 3V15C10.0166 18.3137 7.3303 21 4.0166 21H3.0166Z" />
            </svg>
            <p className="text-2xl md:text-3xl font-medium mb-10 leading-tight text-white">
              "Our Google rating went from 4.2 to 4.8 in just 3 months. The private feedback channel is a lifesaver—we finally have a way to hear from customers before they post publicly."
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-left">
                <p className="font-bold text-white">Camille Rivera</p>
                <p className="text-sm text-slate-400">Director of Experience, Beacon Dental</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-[#e2e8f0]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-6">Ready to improve your reputation?</h2>
          <p className="text-muted mb-10 max-w-xl mx-auto">
            Join businesses using Reviews & Marketing to grow their online presence the compliant way.
          </p>
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <HomeCtaButtons variant="hero" />
                <Link 
                  href="/how-it-works" 
                  className="secondary-button !h-12 px-8 flex items-center gap-2 group"
                >
                  See How It Works
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
              <p className="text-xs text-muted">No credit card required • Setup in 5 minutes</p>
            </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-accent border-t border-[#e2e8f0]">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-semibold mb-4 tracking-wider uppercase text-muted">STAY UPDATED</p>
          <h3 className="mb-8">Weekly tips to collect more reviews.</h3>
          <NewsletterSignup variant="inline" />
        </div>
      </section>
    </main>
  );
}
// force redeploy 5 - compliance update
