import Link from "next/link";

export default function BlogPost() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-emerald-50/50 to-transparent" />
      </div>

      <article className="container mx-auto px-6 pt-32 pb-24 max-w-3xl">
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-brand transition-colors mb-12 uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Insights
        </Link>

        <header className="mb-16">
          <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-6">
            Automation Guide • Feb 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight mb-8">
            Reputation on Autopilot: Scaling Your 5-Star Growth
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-8">
            Learn how to move beyond manual QR codes and implement a systemic approach to customer feedback that runs 24/7 without your intervention.
          </p>
          <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">AC</div>
            <div>
              <p className="text-sm font-bold text-slate-900">Automation Concepts</p>
              <p className="text-xs text-slate-500 font-medium">Streamlining the feedback loop through POS integration.</p>
            </div>
          </div>
        </header>

        <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900">
          <p>
            For many business owners, requesting reviews feels like an extra chore. You have to remember to point out the QR code, or worse, manually ask the customer in person. This "human dependency" is where most reputation strategies fail.
          </p>

          <h2 className="text-2xl mt-12 mb-6">The Automation Shift</h2>
          <p>
            True scale happens when your reputation management is baked into your operations. By integrating your point-of-sale (POS) system—like Square or Clover—directly with your review engine, you remove the friction entirely.
          </p>
          
          <ul>
            <li><strong>Instant Triggers:</strong> Every completed transaction sends a signal to the system.</li>
            <li><strong>Smart Timing:</strong> Emails are sent exactly when the experience is freshest in the customer's mind.</li>
            <li><strong>Consistent Volume:</strong> No more "dry spells" when staff forget to mention the review link.</li>
          </ul>

          <div className="my-12 p-8 bg-emerald-900 rounded-[32px] text-white">
            <h3 className="text-white text-xl font-bold mb-4 italic">"Efficiency is doing things right; effectiveness is doing the right things."</h3>
            <p className="text-emerald-100 text-sm opacity-80">— Peter Drucker</p>
          </div>

          <p>
            In the slidedeck provided below, we break down the exact workflow of an automated system. We explore how data flows from your POS to R&M, how sentiment is filtered, and how your customer database grows while you sleep.
          </p>

          <h2 className="text-2xl mt-12 mb-6 text-emerald-600">Download the Automation Deck</h2>
          <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-bold text-slate-900 mb-1">Reputation Control: Automated</h4>
              <p className="text-sm text-slate-500 mb-4">The executive slidedeck on scaling your 5-star reputation through POS automation.</p>
              <a 
                href="/docs/Reputation_Control_Automated.pdf" 
                download
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 hover:underline"
              >
                Download PDF Deck (1.8MB)
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </div>
          </div>

          <h2 className="text-2xl mt-12 mb-6">Conclusion</h2>
          <p>
            Manual efforts get you started, but systems get you to the finish line. If you are serious about becoming the highest-rated business in your area, automation isn't an option—it's a requirement.
          </p>
        </div>

        <footer className="mt-24 pt-12 border-t border-slate-100 text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Ready to put your growth on autopilot?</p>
          <Link href="/pricing" className="primary-button inline-flex !bg-emerald-600 hover:!bg-emerald-700 shadow-emerald-200">
            View Pro Automation Plans
          </Link>
        </footer>
      </article>
    </main>
  );
}


