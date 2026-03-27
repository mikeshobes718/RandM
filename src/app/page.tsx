export const dynamic = "force-dynamic";

import Link from "next/link";
import NewsletterSignup from "../components/NewsletterSignup";

export default function Home() {
  return (
    <main className="min-h-screen selection:bg-primary/20 overflow-x-hidden bg-surface text-on-surface antialiased">
      {/* ── Hero (Animated Mesh Gradient) ── */}
      <header className="relative pt-32 pb-20 overflow-hidden hero-animated-bg">
        <div className="spotlight" />
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full glass-panel blur-2xl opacity-40 animate-float pulse-glow" />
        <div className="absolute bottom-10 right-20 w-80 h-40 rounded-3xl glass-panel rotate-12 blur-xl opacity-30 animate-float-delayed" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-lg glass-panel -rotate-45 blur-lg opacity-20 animate-float" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full border border-white/10 glass-panel blur-sm opacity-25 animate-float-delayed" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold tracking-wider uppercase border border-white/20">
                Modern Reputation Management
              </span>

              <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight text-white" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
                Grow{" "}
                <span className="inline-flex">
                  <span style={{ color: "#4285F4" }}>G</span>
                  <span style={{ color: "#EA4335" }}>o</span>
                  <span style={{ color: "#FBBC05" }}>o</span>
                  <span style={{ color: "#4285F4" }}>g</span>
                  <span style={{ color: "#34A853" }}>l</span>
                  <span style={{ color: "#EA4335" }}>e</span>
                </span>{" "}
                Reviews.{" "}
                <span className="text-white drop-shadow-md">Recover Private Feedback.</span>{" "}
                <span className="text-white">Compliantly.</span>
              </h1>

              <p className="text-xl leading-relaxed max-w-xl font-medium text-white/90">
                The sophisticated way to curate your online reputation. Route 5-star experiences to Google Maps and handle 1-4 star feedback privately before they hit the public web.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/register" className="primary-gradient text-on-primary px-8 py-4 rounded-lg font-bold text-lg shadow-xl hover:scale-105 transition-transform text-center">
                  Start Free Trial
                </Link>
                <Link href="/how-it-works" className="bg-white/40 backdrop-blur-md border border-white/40 px-8 py-4 rounded-lg font-bold text-lg text-on-background hover:bg-white/60 transition-colors text-center">
                  Watch Demo
                </Link>
              </div>

              <div className="flex items-center gap-4 pt-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden bg-surface-container flex items-center justify-center text-xs font-bold text-primary">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-semibold text-white/80">Trusted by 2,000+ service businesses</p>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl pulse-glow" />
              <div className="bg-white/10 backdrop-blur-2xl p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative border border-white/20">
                <div className="bg-inverse-surface rounded-xl p-6 h-64 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Review Dashboard</span>
                    <span className="text-emerald-400 text-xs font-bold">Live</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider">Reviews</p>
                      <p className="text-white text-2xl font-extrabold">1,284</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider">Rating</p>
                      <p className="text-white text-2xl font-extrabold">4.8</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider">Growth</p>
                      <p className="text-emerald-400 text-2xl font-extrabold">+12%</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-16 mt-4">
                    {[40, 55, 35, 65, 50, 75, 60, 85, 70, 90, 80, 95].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/60 rounded-t-sm" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                <div className="absolute -bottom-10 -left-10 bg-white/95 backdrop-blur-xl p-6 rounded-xl shadow-2xl border border-white/40 max-w-[240px] z-20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-secondary">verified</span>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Sentiment Gate</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-low rounded-full mb-3 overflow-hidden">
                    <div className="h-full bg-secondary w-[85%]" />
                  </div>
                  <p className="text-sm font-medium text-on-background">85% of reviews routed to Google Maps today.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── How Intelligent Routing Works ── */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">How Intelligent Routing Works</h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
              Our proprietary sentiment gate ensures your public profile remains elite while your team handles feedback internally.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "qr_code_2", color: "primary", title: "1. First Touchpoint", text: "Customers scan a QR code or click a link. We capture name and email instantly before they provide a rating." },
              { icon: "star", color: "secondary", title: "2. Smart Routing", text: "Users rating 5-stars are instantly routed to your Google Maps page to post their public review." },
              { icon: "forum", color: "error", title: "3. Recovery Mode", text: "Users rating 1-4 stars are routed to a private feedback form. Handle complaints before they go public." },
            ].map((step) => (
              <div key={step.title} className="bg-surface-container-lowest p-8 rounded-2xl border border-white hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 bg-${step.color}/10 rounded-xl flex items-center justify-center mb-6 text-${step.color}`}>
                  <span className="material-symbols-outlined text-3xl">{step.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-4 text-on-background">{step.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Precision Tools (Bento Grid) ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div className="max-w-xl">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">Precision Tools for Growth</h2>
              <p className="text-on-surface-variant text-lg">
                Everything you need to manage relationships and reputation in one editorial interface.
              </p>
            </div>
            <Link href="/features" className="text-primary font-bold flex items-center gap-2 group whitespace-nowrap">
              Explore all features
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 md:h-[600px]">
            <div className="md:col-span-2 md:row-span-2 bg-surface-container p-8 rounded-2xl flex flex-col justify-between overflow-hidden relative">
              <div>
                <span className="material-symbols-outlined text-4xl text-primary mb-6">group</span>
                <h3 className="text-2xl font-extrabold mb-4">Contacts CRM-Lite</h3>
                <p className="text-on-surface-variant max-w-sm">
                  Manage every customer interaction. Track who reviewed you, who&apos;s pending, and who needs a follow-up call.
                </p>
              </div>
              <div className="mt-8 bg-surface-container-lowest rounded-xl p-4 shadow-lg">
                <div className="space-y-3">
                  {["Julian V.", "Elena R.", "Sophia C."].map((name, i) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary">
                        {name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-[10px] text-on-surface-variant">{["5★ · Google", "2★ · Private", "4★ · Pending"][i]}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        i === 0 ? "bg-emerald-50 text-emerald-700" : i === 1 ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {["Reviewed", "Feedback", "Pending"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-surface-container-high p-8 rounded-2xl flex items-center gap-8">
              <div className="flex-1">
                <h3 className="text-xl font-extrabold mb-2">Dynamic QR Codes</h3>
                <p className="text-on-surface-variant text-sm">Print-ready high-res QR codes for tables, receipts, or business cards.</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/10">
                <span className="material-symbols-outlined text-6xl text-on-surface">qr_code</span>
              </div>
            </div>

            <div className="md:col-span-1 bg-primary text-on-primary p-8 rounded-2xl flex flex-col justify-between">
              <span className="material-symbols-outlined text-3xl">campaign</span>
              <div>
                <h3 className="text-xl font-extrabold mb-2">Email Outreach</h3>
                <p className="text-on-primary/70 text-sm">Automated sequences to request reviews via email.</p>
              </div>
            </div>

            <div className="md:col-span-1 bg-surface-container-highest p-8 rounded-2xl flex flex-col justify-between">
              <span className="material-symbols-outlined text-3xl text-secondary">verified_user</span>
              <div>
                <h3 className="text-xl font-extrabold mb-2">100% Compliant</h3>
                <p className="text-on-surface-variant text-sm">Adheres to Google TOS and regional data privacy laws.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Investment in Your Image</h2>
            <p className="text-on-surface-variant">Choose the plan that fits your business scale.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Free", price: "$0", desc: "Perfect for new solo ventures just getting started with reviews.",
                features: ["10 Reviews / month", "Basic QR Generator"],
                disabled: ["Advanced Sentiment Routing"],
                cta: "Get Started", ctaStyle: "w-full py-3 rounded-lg border-2 border-outline-variant/30 font-bold hover:bg-surface-container-low transition-colors",
                highlight: false,
              },
              {
                name: "Starter", price: "$49", desc: "For growing businesses focused on rapid reputation building.",
                features: ["100 Reviews / month", "Sentiment Routing Logic", "Private Feedback Capture", "CRM-lite Integration"],
                disabled: [],
                cta: "Start 14-Day Trial", ctaStyle: "w-full py-3 rounded-lg primary-gradient text-white font-bold shadow-lg hover:scale-105 transition-transform",
                highlight: true,
              },
              {
                name: "Pro", price: "$149", desc: "For multi-location businesses and large service fleets.",
                features: ["Unlimited Reviews", "Multi-location Support", "API Access & Webhooks", "Dedicated Account Manager"],
                disabled: [],
                cta: "Contact Sales", ctaStyle: "w-full py-3 rounded-lg border-2 border-outline-variant/30 font-bold hover:bg-surface-container-low transition-colors",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`bg-surface-container-lowest p-10 rounded-2xl flex flex-col items-start relative ${
                  plan.highlight ? "border-2 border-primary shadow-2xl" : "border border-outline-variant/10"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? "text-primary" : ""}`}>{plan.price}</span>
                  <span className="text-on-surface-variant text-sm">/month</span>
                </div>
                <p className="text-on-surface-variant text-sm mb-8">{plan.desc}</p>
                <ul className="space-y-4 mb-10 w-full">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm font-medium">
                      <span className="material-symbols-outlined text-secondary text-lg">check_circle</span> {f}
                    </li>
                  ))}
                  {plan.disabled.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm font-medium opacity-40">
                      <span className="material-symbols-outlined text-lg">cancel</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === "Pro" ? "/contact" : "/register"} className={`${plan.ctaStyle} mt-auto text-center block`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dark CTA ── */}
      <section className="py-24 relative overflow-hidden bg-on-background">
        <div className="absolute inset-0 primary-gradient opacity-10" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8">
            Your reputation is your most valuable asset.
          </h2>
          <p className="text-primary-fixed-dim text-xl mb-12">
            Start curating your public perception today. Join thousands of businesses that trust Reviews & Marketing.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/register" className="primary-gradient text-white px-10 py-4 rounded-lg font-bold text-lg hover:scale-105 transition-transform text-center">
              Get Started Free
            </Link>
            <Link href="/contact" className="bg-white/10 text-white border border-white/20 px-10 py-4 rounded-lg font-bold text-lg hover:bg-white/20 transition-colors text-center">
              Book a Personal Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="py-14 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold mb-3 tracking-wider uppercase text-on-surface-variant/60">Stay Updated</p>
          <h3 className="mb-6">Weekly tips to collect more reviews.</h3>
          <NewsletterSignup variant="inline" />
        </div>
      </section>
    </main>
  );
}
