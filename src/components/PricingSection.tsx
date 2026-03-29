"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PricingSection() {
  const [midLoading, setMidLoading] = useState(false);
  const [proLoading, setProLoading] = useState(false);
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
    if (currentTier === tier) { window.location.href = "/settings"; return; }
    if (tier === "mid") setMidLoading(true); else setProLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: billing, tier, concierge }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Failed to start checkout.");
    } finally {
      setMidLoading(false);
      setProLoading(false);
    }
  };

  const handleStarterCta = async () => {
    if (!authed) { window.location.href = "/register"; return; }
    if (currentTier !== "none") { window.location.href = "/dashboard"; return; }
    setMidLoading(true);
    try {
      const res = await fetch("/api/plan/start", { method: "POST" });
      if (res.ok) window.location.href = "/onboarding/business";
    } catch {
      setError("Failed to activate Starter.");
    } finally {
      setMidLoading(false);
    }
  };

  const Check = ({ accent }: { accent?: boolean }) => (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${accent ? 'bg-primary text-white' : 'bg-primary/10'}`}>
      <span className="material-symbols-outlined" style={{ fontSize: 14, color: accent ? 'white' : 'var(--primary)' }}>check</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-6">
      <div className="text-center mb-14">
        <h2 className="text-4xl font-extrabold mb-4 text-on-surface">Simple Pricing</h2>
        <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
          Choose the plan that fits your business. Start free, upgrade anytime.
        </p>

        <div className="mt-8 inline-flex items-center p-1 bg-surface-container rounded-xl">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${billing === "monthly" ? "bg-surface-container-lowest shadow-sm text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${billing === "yearly" ? "bg-surface-container-lowest shadow-sm text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            Yearly <span className="text-[10px] text-secondary ml-1 font-bold">Save 17%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {/* Starter */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col shadow-sm border border-outline-variant/15">
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-1 text-on-surface">Starter</h3>
            <p className="text-sm text-on-surface-variant">Perfect for trying it out.</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-on-surface">$0</span>
            <span className="text-on-surface-variant text-sm ml-2">/ free forever</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            {["3 Review Requests / month", "1 Smart QR Code", "Basic Analytics", "Email Support"].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                <Check />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleStarterCta}
            disabled={midLoading || currentTier !== "none"}
            className="w-full h-12 rounded-xl border-2 border-outline-variant/30 text-on-surface font-bold hover:bg-surface-container-low transition-colors disabled:opacity-50 text-sm"
          >
            {currentTier === "starter" ? "Current Plan" : (currentTier !== "none" ? "Included" : "Get Started Free")}
          </button>
        </div>

        {/* Small Business */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col shadow-xl border-2 border-primary relative transform md:-translate-y-4">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-primary px-4 py-1.5 rounded-full shadow-md">Most Popular</span>
          </div>
          <div className="mb-6 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-on-surface">Small Business</h3>
            </div>
            <p className="text-sm text-on-surface-variant mt-1">For growing teams and repeat customers.</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-primary">{billing === "monthly" ? "$39" : "$390"}</span>
            <span className="text-on-surface-variant text-sm ml-2">{billing === "monthly" ? "/ mo" : "/ yr"}</span>
            {billing === "yearly" && <p className="text-[10px] font-bold text-secondary mt-1">Save 17% -- 2 months free</p>}
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            {["100 Review Requests / month", "5 Smart QR Codes", "Square Integration", "Standard Email Support"].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                <Check accent />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleCheckout("mid")}
            disabled={midLoading || currentTier === "mid" || currentTier === "pro"}
            className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/25 disabled:opacity-50 text-sm"
          >
            {currentTier === "mid" ? "Current Plan" : (currentTier === "pro" ? "Included" : (midLoading ? "Processing..." : "Start Small Business"))}
          </button>
        </div>

        {/* Unlimited */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col shadow-sm border border-outline-variant/15">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-on-surface">Unlimited</h3>
            <p className="text-sm text-on-surface-variant mt-1">Total control & scale.</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-on-surface">{billing === "monthly" ? "$79" : "$790"}</span>
            <span className="text-on-surface-variant text-sm ml-2">{billing === "monthly" ? "/ mo" : "/ yr"}</span>
            {billing === "yearly" && <p className="text-[10px] font-bold text-secondary mt-1">Save 17% -- 2 months free</p>}
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            {["Unlimited Review Requests", "Unlimited QR Codes", "All Integrations", "Priority Support", "Advanced Reporting"].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-on-surface-variant font-medium">
                <Check />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleCheckout("pro")}
            disabled={proLoading || currentTier === "pro"}
            className={`w-full h-12 rounded-xl border-2 border-outline-variant/30 text-on-surface font-bold hover:bg-surface-container-low transition-colors disabled:opacity-50 text-sm ${currentTier === "pro" ? "cursor-default" : ""}`}
          >
            {currentTier === "pro" ? "Current Plan" : (proLoading ? "Processing..." : "Start Unlimited")}
          </button>
        </div>
      </div>

      {/* Footnote */}
      <div className="max-w-3xl mx-auto p-5 bg-surface-container-low rounded-xl text-center mb-14">
        <h4 className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">What counts as a &ldquo;Review Request&rdquo;?</h4>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          A review request is an SMS or email invitation sent from Reviews & Marketing to a customer. QR scans don&apos;t count as requests.
        </p>
      </div>

      {/* Concierge */}
      <div className="max-w-4xl mx-auto mb-20">
        <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-10 shadow-sm border border-outline-variant/15 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>rocket_launch</span>
                <h2 className="text-xl font-bold text-on-surface">Concierge Launch</h2>
                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-md uppercase tracking-widest">Optional</span>
              </div>
              <p className="text-on-surface-variant text-sm mb-5">For businesses that want us to set everything up with them.</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {[
                  "QR codes generated + ready to print",
                  "Place QR guidance (counter, receipt, signage)",
                  "Activation setup (see definition below)",
                  "Message template setup (SMS/email)",
                ].map(f => (
                  <div key={f} className="flex items-start gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-secondary mt-0.5" style={{ fontSize: 14 }}>check</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="p-3 bg-surface-container-low rounded-lg">
                <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">What is Activation?</p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Activation is when your QR is live (placed where customers can scan it) and you&apos;ve launched your review flow (either your first campaign is created, or you&apos;ve recorded initial real usage).
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 p-6 bg-surface-container-low rounded-xl min-w-[200px]">
              <p className="text-3xl font-extrabold text-on-surface">$29</p>
              <label className="flex flex-col items-center gap-3 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={concierge}
                    onChange={(e) => setConcierge(e.target.checked)}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer transition-all"
                  />
                  <span className="text-xs font-semibold text-on-surface">Add to checkout</span>
                </div>
                <p className="text-[10px] text-on-surface-variant">+ $29 one-time fee</p>
              </label>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-error-container rounded-xl text-on-error-container text-sm font-semibold text-center">
          {error}
        </div>
      )}

      {/* FAQ */}
      <div className="grid md:grid-cols-3 gap-10 sm:gap-8 md:gap-10 pt-16 border-t border-outline-variant/15">
        <div>
          <h4 className="text-sm font-bold mb-3 text-on-surface">Cancel anytime?</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">Yes, no long-term contracts. You can cancel your subscription with a single click in settings.</p>
        </div>
        <div>
          <h4 className="text-sm font-bold mb-3 text-on-surface">Is it really free?</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">The Starter plan is 100% free forever. No credit card required to get started.</p>
        </div>
        <div>
          <h4 className="text-sm font-bold mb-3 text-on-surface">Custom needs?</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">For enterprise features or multi-location setups (&gt;10), please <Link href="/contact" className="text-primary font-semibold hover:underline underline-offset-4">contact our sales team</Link>.</p>
        </div>
      </div>
    </div>
  );
}
