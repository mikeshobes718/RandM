import Link from "next/link";

const POSTS = [
  {
    title: "Scripts that turn service moments into ⭐⭐⭐⭐⭐ reviews",
    date: "August 2025",
    excerpt: "Use these proven prompts for in-person, text, and email follow-ups that feel human and convert.",
  },
  {
    title: "QR design principles that actually drive scans",
    date: "July 2025",
    excerpt: "Placement, incentive framing, and artwork guidelines for high-intent customer journeys.",
  },
  {
    title: "The service recovery ladder for 3★ experiences",
    date: "June 2025",
    excerpt: "How to triage, respond, and turn critical feedback into advocates in under 24 hours.",
  },
];

export default function BlogPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-indigo-50 to-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-[-260px] h-[480px] rounded-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_60%)] blur-3xl" />
        <div className="absolute left-[-160px] bottom-[-140px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18),transparent_75%)] blur-3xl" />
      </div>

      <section className="relative px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-600 shadow-sm shadow-slate-900/5 backdrop-blur">Insights</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Playbooks for consistent 5★ reviews</h1>
          <p className="mt-4 text-lg text-slate-600 md:text-xl">
            Practical guides to spark high-intent feedback, recover less-than-perfect experiences, and grow trust at scale.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {POSTS.map((post) => (
            <article key={post.title} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-600">
                {post.date}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900 group-hover:text-indigo-600">{post.title}</h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed flex-1">{post.excerpt}</p>
              <Link href="#" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                Read more
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" /></svg>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
