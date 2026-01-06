import Link from "next/link";

const POSTS = [
  {
    title: "Transparent Pricing for Sustainable Growth",
    slug: "transparent-pricing",
    date: "Jan 2026",
    excerpt: "Why offering tiered value from Starter to Unlimited is the best way to scale your local business reputation.",
    isLive: false
  },
  {
    title: "The 'Review Filter': How Businesses Are Engineering 5-Star Google Ratings",
    slug: "the-review-filter",
    date: "Jan 2026",
    excerpt: "Analysis of the fundamental shift from simply managing reviews to engineering perfect outcomes through smart filtering.",
    isLive: true
  },
  {
    title: "Reputation on Autopilot: Scaling Your 5-Star Growth",
    slug: "reputation-on-autopilot",
    date: "Feb 2026",
    excerpt: "Discover the power of POS integration and how to automate your entire review request workflow for consistent results.",
    isLive: true
  },
  {
    title: "QR design principles that actually drive scans",
    slug: "qr-design",
    date: "April 2026",
    excerpt: "Placement, incentive framing, and artwork guidelines for high-intent customer journeys.",
  },
  {
    title: "Scripts that turn service moments into ⭐⭐⭐⭐⭐ reviews",
    slug: "scripts-that-convert",
    date: "May 2026",
    excerpt: "Use these proven prompts for in-person, text, and email follow-ups that feel human and convert.",
  },
];

export default function BlogPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-260px] h-[480px] rounded-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_60%)] blur-3xl" />
        <div className="absolute left-[-160px] bottom-[-140px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18),transparent_75%)] blur-3xl" />
      </div>

      <section className="relative px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-700 shadow-sm shadow-slate-900/5 backdrop-blur">Insights</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Playbooks for consistent 5★ reviews</h1>
          <p className="mt-4 text-lg text-slate-700 md:text-xl">
            Practical guides to spark high-intent feedback, recover less-than-perfect experiences, and grow trust at scale.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {POSTS.map((post) => (
            <Link 
              key={post.title} 
              href={post.isLive ? `/blog/${post.slug}` : "#"}
              className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl ${!post.isLive ? 'cursor-default' : ''}`}
            >
              <article>
                <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-600">
                  {post.date}
                </div>
                <h2 className="mt-4 text-xl font-semibold text-slate-900 group-hover:text-indigo-600">{post.title}</h2>
                <p className="mt-3 text-sm text-slate-700 leading-relaxed flex-1">{post.excerpt}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-400">
                  {post.isLive ? 'Read Analysis' : 'Coming soon'}
                  {post.isLive ? (
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
