"use client";
import { useEffect, useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [valid, setValid] = useState({ name: true, email: true, message: true });
  useEffect(() => {
    const emailOk = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
    setValid({ name: name.trim().length >= 2, email: emailOk, message: message.trim().length >= 10 });
  }, [name, email, message]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid.name || !valid.email || !valid.message) { setStatus("error"); setError("Please complete all fields"); return; }
    setStatus("sending");
    setError(null);
    try {
      let recaptchaToken: string | undefined;
      try {
        const siteKey = (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '').trim();
        const w = window as unknown as { grecaptcha?: { execute: (key: string, opts: { action: string }) => Promise<string> } };
        if (siteKey && w.grecaptcha) {
          recaptchaToken = await w.grecaptcha.execute(siteKey, { action: 'contact' });
        }
      } catch {}
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, recaptchaToken }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch (e: unknown) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to send message");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-indigo-50 to-white py-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-320px] h-[480px] rounded-full bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.18),transparent_60%)] blur-3xl" />
        <div className="absolute inset-y-0 right-[-200px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.22),transparent_70%)] blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300 shadow-sm shadow-slate-900/5 backdrop-blur">Say hello</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">Let’s build your review engine together</h1>
          <p className="mt-4 text-lg text-slate-300 md:text-xl">Reach the team directly—our specialists typically respond within one business day.</p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl shadow-slate-900/10 backdrop-blur-xl ring-1 ring-slate-200/70">
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                <input aria-label="Name" className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-inner transition focus:outline-none focus:ring-2 ${valid.name ? 'border-slate-200 focus:ring-indigo-400' : 'border-rose-300 focus:ring-rose-400'}`} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="Jordan Smith" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input aria-label="Email" type="email" className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-inner transition focus:outline-none focus:ring-2 ${valid.email ? 'border-slate-200 focus:ring-indigo-400' : 'border-rose-300 focus:ring-rose-400'}`} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                <textarea aria-label="Message" className={`h-44 w-full rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-inner transition focus:outline-none focus:ring-2 ${valid.message ? 'border-slate-200 focus:ring-indigo-400' : 'border-rose-300 focus:ring-rose-400'}`} value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} placeholder="Tell us about your goals or questions." />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button disabled={status === "sending"} className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                  {status === "sending" ? "Sending…" : "Send message"}
                </button>
                <p className="text-xs text-slate-500">We’ll follow up by email. You can expect a response within one business day.</p>
              </div>
              {status === "sent" && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Thanks! We received your message.</div>}
              {status === "error" && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            </form>
          </div>
          <div className="space-y-5 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-lg shadow-slate-900/10 backdrop-blur">
            <h2 className="text-lg font-semibold text-white">Connect with a specialist</h2>
            <p className="text-sm text-slate-300">Prefer email? Reach us at
              <a href="mailto:support@reviewsandmarketing.com" className="mt-1 block font-semibold text-indigo-600 hover:underline break-all whitespace-normal">support@reviewsandmarketing.com</a>
            </p>
            <div className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-300 shadow-inner">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Sales</div>
                <a href="mailto:sales@reviewsandmarketing.com" className="mt-1 block font-medium text-white hover:text-indigo-600">sales@reviewsandmarketing.com</a>
                <p className="text-xs text-slate-500">Strategy consults, pricing, custom onboarding</p>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Support</div>
                <a href="mailto:support@reviewsandmarketing.com" className="mt-1 block font-medium text-white hover:text-indigo-600">support@reviewsandmarketing.com</a>
                <p className="text-xs text-slate-500">Response within one business day, Mon–Fri 9a–6p ET</p>
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-500/15 via-indigo-500/5 to-transparent p-5 text-sm text-slate-700 shadow-lg shadow-indigo-500/20">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600">Live demo</div>
              <p className="mt-2">Want to see the dashboard in action? We’ll tailor a 15 minute session to your workflow.</p>
              <a href="mailto:sales@reviewsandmarketing.com?subject=Demo%20request" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                Request a demo
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 12h14m-6-6l6 6-6 6"/></svg>
              </a>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-xs text-slate-500 shadow-inner">
              <div className="font-semibold text-slate-300">Status</div>
              <p className="mt-1">All systems operational. Check <a href="https://status.reviewsandmarketing.com" className="text-indigo-600 hover:underline">status.reviewsandmarketing.com</a> for live updates.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
