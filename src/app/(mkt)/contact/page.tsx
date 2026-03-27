"use client";
import { useEffect, useState } from "react";
import { primaryButtonClass, secondaryButtonClass, inputClass } from "@/lib/styles";

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
    if (!valid.name || !valid.email || !valid.message) { 
      setStatus("error"); 
      setError("Please complete all fields correctly."); 
      return; 
    }
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
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-8">
            Contact Us
          </div>
          <h1 className="text-balance mb-6">
            Let's build your review <br className="hidden md:block" />
            <span className="text-brand">engine together.</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Reach our specialists directly—we typically respond within one business day.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <div className="surface-card p-8 md:p-10 rounded-[32px]">
              <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      className={`${inputClass} ${!valid.name && name ? 'border-red-300' : ''}`}
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      placeholder="Jane Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      className={`${inputClass} ${!valid.email && email ? 'border-red-300' : ''}`}
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      placeholder="jane@company.com" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Your Message</label>
                  <textarea 
                    className={`${inputClass} h-40 py-4 resize-none ${!valid.message && message ? 'border-red-300' : ''}`}
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    required 
                    placeholder="Tell us about your business goals..." 
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                  <button 
                    disabled={status === "sending"} 
                    className="primary-button h-14 px-10 w-full sm:w-auto"
                  >
                    {status === "sending" ? "Sending..." : "Send Message"}
                  </button>
                  <p className="text-xs text-muted text-center sm:text-left leading-relaxed">
                    Expected response time: <br className="hidden sm:block" />
                    <span className="font-bold text-foreground">Under 24 hours</span>
                  </p>
                </div>

                {status === "sent" && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium animate-fade-in">
                    Success! We've received your message and will be in touch shortly.
                  </div>
                )}
                {status === "error" && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 font-medium animate-fade-in">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="surface-card p-8 rounded-[32px] bg-accent/30 border-dashed">
              <h2 className="text-lg font-bold mb-6">Direct Channels</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Support</div>
                    <a href="mailto:support@reviewsandmarketing.com" className="text-sm font-bold text-brand hover:underline">support@reviewsandmarketing.com</a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Sales</div>
                    <a href="mailto:sales@reviewsandmarketing.com" className="text-sm font-bold text-emerald-600 hover:underline">sales@reviewsandmarketing.com</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-brand/5 rounded-[32px] border border-brand/10">
              <h2 className="text-lg font-bold text-brand mb-4">Live Demo</h2>
              <p className="text-sm text-brand/80 leading-relaxed mb-6">
                Want to see how it works for your specific industry? Book a 15-minute walkthrough with our strategy team.
              </p>
              <a href="mailto:sales@reviewsandmarketing.com?subject=Demo%20Request" className="text-sm font-black text-brand hover:underline inline-flex items-center gap-2">
                Request a Demo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </a>
            </div>

            <div className="px-8 py-4 bg-accent rounded-full border border-border flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">System Status</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-tight">Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
