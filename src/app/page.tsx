export const dynamic = "force-dynamic";

import Link from "next/link";
import HomeCtaButtons from "../components/HomeCtaButtons";
import NewsletterSignup from "../components/NewsletterSignup";

const features = [
  {
    title: "Review Routing",
    description: "Happy customers are sent to Google. Unhappy customers give you private feedback first.",
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    )
  }
];

const steps = [
  {
    num: "01",
    title: "Connect Profile",
    text: "Link your Google Business Profile in seconds with our smart search."
  },
  {
    num: "02",
    title: "Deploy Toolkit",
    text: "Print your QR codes or send automated email requests to your customers."
  },
  {
    num: "03",
    title: "Boost Rating",
    text: "Watch your 5-star review count climb as we filter out the noise."
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
              The smartest way to get <br className="hidden md:block" />
              <span className="text-brand">5-star </span>
              <span className="inline-flex">
                <span style={{ color: '#4285F4' }}>G</span>
                <span style={{ color: '#EA4335' }}>o</span>
                <span style={{ color: '#FBBC05' }}>o</span>
                <span style={{ color: '#4285F4' }}>g</span>
                <span style={{ color: '#34A853' }}>l</span>
                <span style={{ color: '#EA4335' }}>e</span>
              </span>
              <span className="text-brand"> reviews.</span>
            </h1>
            <p className="text-xl text-muted max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
              Automated review requests, smart QR codes, and a private feedback filter to protect your public rating.
            </p>
            <HomeCtaButtons variant="hero" />
            
            <div className="mt-16 flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-40 grayscale contrast-125">
              <span className="font-bold text-xl tracking-tighter uppercase">Google</span>
              <span className="font-bold text-xl tracking-tighter uppercase">Square</span>
              <span className="font-bold text-xl tracking-tighter uppercase">Stripe <span className="text-[10px] font-black tracking-normal opacity-60">(Coming Soon)</span></span>
              <span className="font-bold text-xl tracking-tighter uppercase">PayPal <span className="text-[10px] font-black tracking-normal opacity-60">(Coming Soon)</span></span>
            </div>
          </div>
        </div>
        
        {/* Subtle background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 pointer-events-none opacity-[0.03]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,var(--brand),transparent_70%)]"></div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 bg-accent/50 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="mb-4">How it works</h2>
            <p className="text-muted">A simple 3-step system designed for busy operators.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {steps.map((step) => (
              <div key={step.num} className="relative group">
                <div className="text-5xl font-black text-brand/10 mb-4 group-hover:text-brand/20 transition-colors">{step.num}</div>
                <h3 className="mb-3">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
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
              "Our Google rating went from 4.2 to 4.8 in just 3 months. The routing system is a lifesaver—we finally have control over our online reputation."
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
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <h2 className="mb-6">Ready to fix your reputation?</h2>
          <p className="text-muted mb-10 max-w-xl mx-auto">
            Join 500+ businesses using Reviews & Marketing to grow their online presence.
          </p>
          <div className="flex flex-col items-center gap-6">
            <HomeCtaButtons variant="hero" />
            <p className="text-xs text-muted">No credit card required • Setup in 5 minutes</p>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-accent border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm font-semibold mb-4 tracking-wider uppercase text-muted">STAY UPDATED</p>
          <h3 className="mb-8">Weekly tips to collect more reviews.</h3>
          <NewsletterSignup variant="inline" />
        </div>
      </section>
    </main>
  );
}
