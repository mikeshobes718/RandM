import Link from "next/link";

export default function HowItWorks() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-brand/5 to-transparent" />
      </div>

      <section className="container mx-auto px-6 pt-32 pb-24 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-6">
            Process Overview
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight mb-6">
            How Reviews & Marketing Works
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            A simple, compliant system designed to recover unhappy customers privately and amplify your best experiences.
          </p>
        </div>

        {/* YouTube Explainer Video */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="relative aspect-video rounded-[40px] overflow-hidden shadow-2xl shadow-brand/20 border-8 border-white bg-slate-100 group">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/y0Jb0wNecfk?autoplay=0&rel=0"
              title="Reviews & Marketing Explainer Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <div className="absolute inset-0 pointer-events-none border border-brand/5 rounded-[32px]"></div>
          </div>
          <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Watch the Walkthrough</h4>
                <p className="text-xs text-muted font-medium">See how we build authentic reputations.</p>
              </div>
            </div>
            <div className="flex -space-x-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Explainer Image */}
        <div className="relative mb-24 rounded-[40px] overflow-hidden border-8 border-white shadow-2xl shadow-brand/10 bg-slate-50 group">
          <img 
            src="/assets/detailed.png" 
            alt="Visual Explainer of how R&M works" 
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 pointer-events-none border border-brand/5 rounded-[32px]"></div>
        </div>

        {/* Breakdown Sections */}
        <div className="grid md:grid-cols-3 gap-12 mb-24">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-xl">1</div>
            <h3 className="text-xl font-bold text-slate-900">Capture</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Customers scan a branded QR code at your location or receive an automated email after a transaction.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-xl">2</div>
            <h3 className="text-xl font-bold text-slate-900">Listen</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              We don’t incentivize or gate reviews—we use smart Review Routing. We provide a direct path for praise to Google or private feedback to you.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand font-black text-xl">3</div>
            <h3 className="text-xl font-bold text-slate-900">Improve</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Watch your public rating grow while you collect private insights to fix service issues and build a stronger customer database.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="p-12 bg-slate-900 rounded-[48px] text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none"></div>
          <h2 className="text-3xl font-black mb-6 relative z-10">Ready to start building your reputation?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link href="/register" className="primary-button h-14 px-10 text-lg shadow-xl shadow-brand/20">
              Get Started For Free
            </Link>
            <Link href="/pricing" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
              View Plans & Pricing →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
