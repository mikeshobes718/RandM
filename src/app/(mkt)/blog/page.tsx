import Link from "next/link";

const POSTS = [
  {
    title: "Reputation on Autopilot: Scaling Your Growth Compliantly",
    slug: "reputation-on-autopilot",
    date: "Feb 2026",
    sortDate: "2026-02-01",
    category: "Automation",
    excerpt: "Discover the power of POS integration and how to automate your entire review request workflow while staying fully compliant.",
    isLive: true,
    image: "🤖"
  },
  {
    title: "Reputation Growth & Protection: The Strategy Guide",
    slug: "reputation-growth-protection",
    date: "Jan 2026",
    sortDate: "2026-01-15",
    category: "Strategy",
    excerpt: "The complete blueprint for building a 5-star brand and protecting your business with private feedback channels.",
    isLive: true,
    image: "🛡️"
  },
  {
    title: "The 'Feedback Loop': How Businesses Are Recovering Customers Privately",
    slug: "the-review-filter",
    date: "Jan 2026",
    sortDate: "2026-01-01",
    category: "Operations",
    excerpt: "Analysis of the fundamental shift from simply managing reviews to recovering customers through smart Review Routing.",
    isLive: true,
    image: "🔄"
  }
];

export default function BlogPage() {
  const sortedPosts = [...POSTS].sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());
  const featuredPost = sortedPosts[0];
  const otherPosts = sortedPosts.slice(1);

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface">
      {/* Background Decor */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-surface-container-lowest to-surface" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] bg-brand/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
      </div>

      <section className="relative px-6 pt-32 pb-20 sm:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-brand mb-6">
                Knowledge Base
              </span>
              <h1 className="text-5xl font-black tracking-tight text-on-surface sm:text-7xl mb-6">
                Growth <span className="text-brand">Playbooks</span>
              </h1>
              <p className="text-xl text-on-surface-variant font-medium leading-relaxed">
                Practical guides for consistent 5-star reputation, private customer recovery, and scaling your brand trust.
              </p>
            </div>
          </div>

          {/* Featured Post */}
          {featuredPost && (
            <div className="mb-24">
              <Link 
                href={`/blog/${featuredPost.slug}`}
                className="group relative flex flex-col lg:flex-row gap-12 p-8 lg:p-12 rounded-[48px] bg-inverse-surface overflow-hidden shadow-2xl transition-all hover:scale-[1.01]"
              >
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.15),transparent)] opacity-50 pointer-events-none" />
                <div className="flex-1 relative z-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-brand/20 text-brand text-[10px] font-black uppercase tracking-widest rounded-lg border border-brand/30">Featured Guide</span>
                    <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest">{featuredPost.date}</span>
                  </div>
                  <h2 className="text-3xl lg:text-5xl font-black text-white mb-6 group-hover:text-brand transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="text-lg text-on-surface-variant/60 font-medium leading-relaxed mb-8 max-w-xl">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white group-hover:gap-5 transition-all">
                    Read Strategic Analysis
                    <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 relative min-h-[300px] flex items-center justify-center">
                   <div className="w-full h-full bg-white/5 rounded-[32px] border border-white/10 flex items-center justify-center text-[120px]">
                     {featuredPost.image}
                   </div>
                </div>
              </Link>
            </div>
          )}

          {/* Grid of Other Posts */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherPosts.map((post) => (
              <Link 
                key={post.title} 
                href={`/blog/${post.slug}`}
                className="group flex flex-col h-full bg-surface rounded-[40px] border border-outline-variant/20 p-8 shadow-xl shadow-outline-variant/20 transition-all hover:border-brand/20 hover:-translate-y-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest flex items-center justify-center text-3xl mb-8 group-hover:bg-brand/5 group-hover:scale-110 transition-all duration-500">
                  {post.image}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand">{post.category}</span>
                  <span className="w-1 h-1 rounded-full bg-surface-container" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">{post.date}</span>
                </div>
                <h3 className="text-xl font-black text-on-surface mb-4 group-hover:text-brand transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-8 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 group-hover:text-brand transition-all">
                  Read Analysis
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
// force redeploy - blog compliance