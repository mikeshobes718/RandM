import Link from "next/link";

export default function ReputationGrowthProtectionBlog() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-surface">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent" />
      </div>

      <article className="container mx-auto px-6 pt-32 pb-24 max-w-5xl">
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant/60 hover:text-brand transition-colors mb-12 uppercase tracking-widest"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Insights
        </Link>

        <header className="mb-16 max-w-3xl">
          <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-6">
            Complete Guide • Jan 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface leading-tight mb-8">
            Reputation Growth & Protection: The Ultimate Strategy Guide
          </h1>
          <div className="flex items-center gap-4 p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/20">
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold">RM</div>
            <div>
              <p className="text-sm font-bold text-on-surface">Reviews & Marketing Strategy</p>
              <p className="text-xs text-on-surface-variant font-medium">Your blueprint for building a 5-star brand.</p>
            </div>
          </div>
        </header>

        <div className="mb-12">
          <p className="text-xl text-on-surface-variant font-medium leading-relaxed mb-12 italic border-l-4 border-brand/20 pl-6 max-w-3xl">
            In today's digital landscape, your reputation is your most valuable asset. This guide explores the systemic approach to growing your public rating while protecting your business from negative feedback.
          </p>
          
          <div className="bg-slate-100 rounded-[40px] p-4 md:p-8 shadow-2xl border border-outline-variant/30">
            <div className="flex items-center justify-between mb-6 px-4">
              <h3 className="text-lg font-black text-on-surface uppercase tracking-widest">Strategy Deck Viewer</h3>
              <a 
                href="/Reputation_Growth_and_Protection.pdf" 
                target="_blank"
                className="text-[10px] font-black bg-brand text-white px-4 py-2 rounded-full uppercase tracking-widest hover:bg-brand/90 transition-all shadow-lg shadow-brand/20"
              >
                Open Fullscreen
              </a>
            </div>
            
            <div className="relative aspect-[16/10] w-full bg-surface rounded-[32px] overflow-hidden shadow-inner border border-outline-variant/30">
              <iframe 
                src="/Reputation_Growth_and_Protection.pdf#toolbar=0&navpanes=0&scrollbar=0" 
                className="absolute inset-0 w-full h-full"
                title="Reputation Growth & Protection PDF"
              />
            </div>
            
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
              <div className="flex-1">
                <h4 className="font-bold text-on-surface">Professional Strategy Deck</h4>
                <p className="text-sm text-on-surface-variant">The same blueprint we use for enterprise clients.</p>
              </div>
              <a 
                href="/Reputation_Growth_and_Protection.pdf" 
                download
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand hover:underline group"
              >
                Download for Offline Reading
                <svg className="w-4 h-4 transition-transform group-hover:translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="prose prose-slate prose-lg max-w-3xl prose-headings:font-black prose-headings:tracking-tight prose-p:text-on-surface-variant prose-p:leading-relaxed prose-strong:text-on-surface">
          <h2 className="text-2xl mt-12 mb-6">Mastering the 'Moat'</h2>
          <p>
            Building a reputation isn't just about getting more reviews; it's about building a 'moat' around your business. This strategy involves three key pillars:
          </p>
          <ol>
            <li><strong>Automated Ingestion:</strong> Capturing sentiment at the moment of peak customer satisfaction.</li>
            <li><strong>Private Resolution:</strong> Diverting potential issues to a private channel before they reach public platforms.</li>
            <li><strong>Data-Driven Growth:</strong> Using feedback to improve operations and drive more repeat business.</li>
          </ol>
          
          <p>
            Explore the deck above to see how these mechanics work in practice, including real-world examples of businesses that transformed their Google rating in weeks.
          </p>
        </div>

        <footer className="mt-24 pt-12 border-t border-outline-variant/20 text-center">
          <p className="text-sm font-bold text-on-surface-variant/60 uppercase tracking-widest mb-6">Ready to build your moat?</p>
          <Link href="/register" className="primary-button inline-flex">
            Get Started For Free
          </Link>
        </footer>
      </article>
    </main>
  );
}
