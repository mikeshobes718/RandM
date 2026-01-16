"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Pricing() {
  const [midLoading, setMidLoading] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [authed, setAuthed] = useState(false);
  const [planStatus, setPlanStatus] = useState<"loading" | "none" | string>("loading");
  const [currentTier, setCurrentTier] = useState<"starter" | "mid" | "pro" | "none">("none");
  const [concierge, setConcierge] = useState(false);

  useEffect(() => {
    const checkAuthAndPlan = async () => {
      try {
        const token = localStorage.getItem("idToken");
        setAuthed(Boolean(token));
        
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/plan/status", { cache: "no-store", headers });
        if (res.ok) {
          const data = await res.json();
          const status = (data.status || "none").toLowerCase();
          const planId = data.plan_id;
          
          setPlanStatus(status);
          
          if (status === "active" || status === "trialing") {
            const pid = (planId || "").toLowerCase();
            if (pid.includes("mid") || pid.includes("small-business") || pid.includes("small") || pid.includes("growth")) {
              setCurrentTier("mid");
            } else {
              setCurrentTier("pro");
            }
          } else if (status === "starter") {
            setCurrentTier("starter");
          } else {
            setCurrentTier("none");
          }
          
          setHasPlan(status !== "none");
        } else {
          setPlanStatus("none");
          setCurrentTier("none");
        }
      } catch {
        setPlanStatus("none");
        setCurrentTier("none");
      }
    };
    checkAuthAndPlan();
  }, []);

  const handleCheckout = async (tier: "mid" | "pro") => {
    if (currentTier === tier) {
      window.location.href = "/settings";
      return;
    }
    
    if (tier === "mid") setMidLoading(true);
    else setProLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billing, tier, concierge }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError("Failed to start checkout.");
    } finally {
      setMidLoading(false);
      setProLoading(false);
    }
  };

  const handleStarterCta = async () => {
    if (!authed) {
      window.location.href = "/register";
      return;
    }
    if (currentTier === "starter" || currentTier === "mid" || currentTier === "pro") {
      window.location.href = "/dashboard";
      return;
    }
    setMidLoading(true); // Reuse midLoading for starter activation
    try {
      const res = await fetch("/api/plan/start", { method: "POST" });
      if (res.ok) window.location.href = "/onboarding/business";
    } catch {
      setError("Failed to activate Starter.");
    } finally {
      setMidLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-24 px-6 bg-slate-50/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black tracking-tight mb-4 text-slate-900">Simple Pricing</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">
            Choose the plan that fits your business. Start free, upgrade anytime.
          </p>
          
          <div className="mt-10 inline-flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
            <button 
              onClick={() => setBilling("monthly")}
              className={`px-8 py-2.5 text-sm font-black rounded-xl transition-all ${billing === "monthly" ? "bg-white shadow-md text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBilling("yearly")}
              className={`px-8 py-2.5 text-sm font-black rounded-xl transition-all ${billing === "yearly" ? "bg-white shadow-md text-slate-900" : "text-slate-400 hover:text-slate-600"}`}
            >
              Yearly <span className="text-[10px] text-emerald-600 ml-1 font-black uppercase tracking-widest">— Save 17% (2 months free)</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Starter Card */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col group hover:scale-[1.02] transition-transform">
            <div className="mb-8">
              <h3 className="text-xl font-black mb-2 text-slate-900">Starter</h3>
              <p className="text-sm text-slate-500 font-medium">Perfect for trying it out.</p>
            </div>
            <div className="mb-8">
              <span className="text-4xl font-black text-slate-900">$0</span>
              <span className="text-slate-400 text-sm font-bold ml-2">/ free forever</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              {["3 Review Requests / month", "1 Smart QR Code", "Basic Analytics", "Email Support"].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={handleStarterCta}
              disabled={midLoading || currentTier !== "none"}
              className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-slate-100 text-slate-400 disabled:opacity-50 hover:bg-slate-50 transition-all"
            >
              {currentTier === "starter" ? "Current Plan" : (currentTier !== "none" ? "Included" : "Get Started Free")}
            </button>
          </div>

          {/* Small Business Card */}
          <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-2xl shadow-brand/5 flex flex-col relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
            <div className="mb-8 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black mb-2 text-slate-900">Small Business</h3>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand bg-brand/5 px-2.5 py-1 rounded-lg border border-brand/10">Growth</span>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">For growing teams and repeat customers.</p>
            </div>
            <div className="mb-8 relative z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">{billing === "monthly" ? "$39" : "$390"}</span>
                <span className="text-slate-400 text-sm font-bold">{billing === "monthly" ? "/ mo" : "/ yr"}</span>
              </div>
              {billing === "yearly" && <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Save 17% — 2 months free</p>}
            </div>
            <ul className="space-y-4 mb-10 flex-1 relative z-10">
              {["100 Review Requests / month", "5 Smart QR Codes", "Square Integration", "Standard Email Support"].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                  <div className="w-5 h-5 rounded-full bg-brand/5 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleCheckout("mid")}
              disabled={midLoading || currentTier === "mid" || currentTier === "pro"}
              className="primary-button w-full h-14 rounded-2xl shadow-xl shadow-brand/20 disabled:opacity-50 relative z-10"
            >
              {currentTier === "mid" ? "Current Plan" : (currentTier === "pro" ? "Included" : (midLoading ? "Processing..." : "Start Small Business"))}
            </button>
          </div>

          {/* Unlimited Card */}
          <div className="bg-white p-8 rounded-[40px] border-4 border-brand shadow-2xl shadow-brand/20 flex flex-col relative scale-[1.05] z-10 group transition-all">
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-brand/20 transition-all duration-700"></div>
            <div className="mb-8 relative z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black mb-2 text-brand">Unlimited</h3>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white bg-brand px-2.5 py-1.5 rounded-lg shadow-lg shadow-brand/30">Recommended</span>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">Total control & scale.</p>
            </div>
            <div className="mb-8 relative z-10">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">{billing === "monthly" ? "$79" : "$790"}</span>
                <span className="text-slate-400 text-sm font-bold">{billing === "monthly" ? "/ mo" : "/ yr"}</span>
              </div>
              {billing === "yearly" && <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Save 17% — 2 months free</p>}
            </div>
            <ul className="space-y-4 mb-10 flex-1 relative z-10">
              {["Unlimited Review Requests", "Unlimited QR Codes", "All Integrations", "Priority Support", "Advanced Reporting"].map(f => (
                <li key={f} className="flex items-center gap-3 text-sm font-bold text-slate-900">
                  <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand/20">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => handleCheckout("pro")}
              disabled={proLoading || currentTier === "pro"}
              className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all relative z-10 ${currentTier === "pro" ? "bg-slate-100 text-slate-400 cursor-default" : "bg-slate-900 hover:bg-black text-white shadow-2xl shadow-slate-900/30"}`}
            >
              {currentTier === "pro" ? "Current Plan" : (proLoading ? "Processing..." : "Start Unlimited")}
            </button>
          </div>
        </div>

        {/* Footnote */}
        <div className="max-w-3xl mx-auto p-6 bg-slate-100/50 rounded-3xl border border-slate-200 mb-16 text-center">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">What counts as a “Review Request”?</h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
            A review request is an SMS or email invitation sent from Reviews & Marketing to a customer. QR scans don’t count as requests.
          </p>
        </div>

        {/* Concierge Section */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🚀</span>
                    <h2 className="text-2xl font-black text-slate-900">Concierge Launch (Optional)</h2>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg uppercase tracking-widest">One-time</span>
                  </div>
                  <p className="text-slate-500 font-bold mb-6">For businesses that want us to set everything up with them.</p>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {[
                      "QR codes generated + ready to print",
                      "Place QR guidance (counter, receipt, signage)",
                      "Activation setup (see definition below)",
                      "Message template setup (SMS/email)"
                    ].map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <span className="text-amber-500 font-black">✓</span>
                        {f}
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">What is Activation?</p>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Activation is when your QR is live (placed where customers can scan it) and you’ve launched your review flow (either your first campaign is created, or you’ve recorded initial real usage).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 p-8 bg-slate-50 rounded-[32px] border border-slate-100 min-w-[240px]">
                  <p className="text-4xl font-black text-slate-900">$29</p>
                  <label className="flex flex-col items-center gap-3 cursor-pointer group/label">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={concierge}
                        onChange={(e) => setConcierge(e.target.checked)}
                        className="w-6 h-6 rounded-lg border-2 border-slate-300 text-brand focus:ring-brand cursor-pointer transition-all checked:border-brand"
                      />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-600 group-hover/label:text-slate-900">Add to checkout</span>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">+ $29 one-time fee</p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-bold text-center animate-shake">{error}</div>}

        {/* FAQ Teaser */}
        <div className="grid md:grid-cols-3 gap-12 pt-24 border-t border-slate-200">
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Cancel anytime?</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed italic">Yes, no long-term contracts. You can cancel your subscription with a single click in settings.</p>
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Is it really free?</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed italic">The Starter plan is 100% free forever. No credit card required to get started.</p>
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Custom needs?</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed italic text-balance">For enterprise features or multi-location setups (&gt;10), please <Link href="/contact" className="text-brand font-black hover:underline underline-offset-4">contact our sales team</Link>.</p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-300">v1.0.8-live</p>
        </div>
      </div>
    </main>
  );
}
