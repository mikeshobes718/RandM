import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Customer Success Stories',
  description: 'See how businesses like yours are collecting more 5-star reviews and growing with Reviews & Marketing. Real results, real metrics.',
  openGraph: {
    title: 'Customer Success Stories | Reviews & Marketing',
    description: 'Real businesses, real results. See how Reviews & Marketing helps collect more reviews.',
  },
};

const caseStudies = [
  {
    business: "Beacon Dental",
    industry: "Healthcare",
    location: "San Francisco, CA",
    logo: "🦷",
    tagline: "From 12 reviews to 250+ in 6 months",
    challenge: "Low online visibility with only 12 Google reviews despite 8 years in business. Patients weren't leaving feedback even though satisfaction was high.",
    solution: "Implemented QR codes at reception desk and checkout. Set up automated email follow-ups 24 hours after appointments. Trained staff to mention the review process during checkout.",
    results: [
      { metric: "250+", label: "New reviews in 6 months", icon: "⭐" },
      { metric: "4.9", label: "Average rating", icon: "📊" },
      { metric: "42%", label: "Increase in new patient calls", icon: "📞" },
      { metric: "3.2x", label: "Higher Google Maps visibility", icon: "🗺️" },
    ],
    quote: "The ready-made email templates are a lifesaver. We launched our first requests in minutes and watched real reviews come in that same week. Our front desk staff loves how simple the QR codes are—patients scan and leave reviews right from the waiting room.",
    author: "Dr. Camille Rivera",
    role: "Director of Patient Experience",
    image: "/case-studies/beacon-dental.jpg",
    testimonialRating: 5,
  },
  {
    business: "Skyline Fitness",
    industry: "Boutique Fitness",
    location: "Austin, TX (3 locations)",
    logo: "💪",
    tagline: "Unified review strategy across 3 locations",
    challenge: "Managing reviews for multiple locations was chaotic. Each gym had different processes, and it was impossible to track which location was performing well. No centralized system meant missed opportunities.",
    solution: "Deployed location-specific QR codes at each gym's front desk and in the locker rooms. Set up the multi-location dashboard to track performance by site. Created a friendly competition between locations to boost participation.",
    results: [
      { metric: "187", label: "Total reviews collected", icon: "⭐" },
      { metric: "3", label: "Locations managed from one dashboard", icon: "🏢" },
      { metric: "23%", label: "Increase in membership signups", icon: "📈" },
      { metric: "4.8", label: "Average rating across all locations", icon: "🎯" },
    ],
    quote: "The dashboard keeps every location honest. Scans, clicks, and ratings are right there so managers know when to nudge their teams. We turned review collection into a friendly competition—our downtown location is crushing it now.",
    author: "Jordan Blake",
    role: "General Manager",
    image: "/case-studies/skyline-fitness.jpg",
    testimonialRating: 5,
  },
  {
    business: "Harbor House Inn",
    industry: "Hospitality",
    location: "Portland, ME",
    logo: "🏨",
    tagline: "Transformed guest feedback into bookings",
    challenge: "Great in-person experience but poor online reputation (3.2 stars on Google). Guests would rave about their stay but forget to leave reviews. Competitors with worse service had better ratings.",
    solution: "Added QR codes to checkout receipts and in-room welcome cards. Sent personalized thank-you emails 3 days post-checkout with direct review link. Monitored private feedback to address concerns before they became public reviews.",
    results: [
      { metric: "142", label: "New 5-star reviews", icon: "⭐" },
      { metric: "3.2→4.7", label: "Rating improvement", icon: "📊" },
      { metric: "67%", label: "Increase in direct bookings", icon: "🔗" },
      { metric: "89%", label: "Guest response rate", icon: "💬" },
    ],
    quote: "We went from a 3.2 to a 4.7 rating in just 4 months. The private feedback feature is gold—we can address issues before they hit Google. Our direct bookings are up 67% because travelers trust our reviews now.",
    author: "Emily Chen",
    role: "Inn Manager",
    image: "/case-studies/harbor-house.jpg",
    testimonialRating: 5,
  },
  {
    business: "Summit Tech Solutions",
    industry: "B2B Technology",
    location: "Seattle, WA",
    logo: "💻",
    tagline: "Built trust with enterprise clients",
    challenge: "Struggled to win enterprise contracts due to lack of social proof. Only had 5 reviews on Google, all from small clients. Needed credible testimonials to compete with established players.",
    solution: "Created a systematic post-project review request process. Set up team collaboration so account managers could assign follow-ups. Used the Pro plan's priority support to customize templates for different client segments.",
    results: [
      { metric: "48", label: "Enterprise client reviews", icon: "⭐" },
      { metric: "$2.4M", label: "Pipeline influenced by reviews", icon: "💰" },
      { metric: "5x", label: "Increase in demo requests", icon: "📈" },
      { metric: "4.9", label: "Average client rating", icon: "🎯" },
    ],
    quote: "Team invites and priority support let us roll the platform out fast. Our follow-ups finally look and feel like our brand. We closed a $300K deal last month where the prospect specifically mentioned our reviews during the sales call.",
    author: "Lisa Thompson",
    role: "CEO",
    image: "/case-studies/summit-tech.jpg",
    testimonialRating: 5,
  },
];

export default function CaseStudiesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-surface">
      {/* Hero */}
      <section className="relative px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-container px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-on-primary-container">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Success Stories
          </span>
          <h1 className="mt-6 text-4xl font-bold text-on-surface sm:text-5xl lg:text-6xl">
            Real businesses, real results
          </h1>
          <p className="mt-6 text-xl text-on-surface-variant max-w-3xl mx-auto">
            See how companies across industries are collecting more 5-star reviews and growing with Reviews & Marketing.
          </p>
        </div>
      </section>

      {/* Case Studies */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-24">
          {caseStudies.map((study, index) => (
            <article
              key={study.business}
              className="overflow-hidden rounded-3xl border-2 border-outline-variant/30 bg-surface shadow-2xl hover:shadow-3xl transition"
            >
              {/* Header */}
              <div className="primary-gradient px-8 py-12 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-5xl">{study.logo}</span>
                      <div>
                        <h2 className="text-3xl font-bold">{study.business}</h2>
                        <p className="text-on-primary/70">{study.industry} • {study.location}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-white mt-4">{study.tagline}</p>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(study.testimonialRating)].map((_, i) => (
                      <svg key={i} className="h-6 w-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                {/* Challenge */}
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-on-surface mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 text-sm font-bold">!</span>
                    The Challenge
                  </h3>
                  <p className="text-on-surface-variant leading-relaxed">{study.challenge}</p>
                </div>

                {/* Solution */}
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-on-surface mb-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">✓</span>
                    The Solution
                  </h3>
                  <p className="text-on-surface-variant leading-relaxed">{study.solution}</p>
                </div>

                {/* Results */}
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-on-surface mb-6">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm font-bold">📊</span>
                    The Results
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {study.results.map((result) => (
                      <div key={result.label} className="rounded-2xl border-2 border-outline-variant/30 bg-gradient-to-br from-surface-container-lowest to-surface p-6 text-center">
                        <div className="text-3xl mb-2">{result.icon}</div>
                        <div className="text-3xl font-bold text-on-surface mb-1">{result.metric}</div>
                        <div className="text-sm text-on-surface-variant">{result.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quote */}
                <div className="rounded-2xl border-l-4 border-primary bg-primary-container/30 p-6">
                  <blockquote className="text-lg text-on-surface leading-relaxed mb-4">
                    "{study.quote}"
                  </blockquote>
                  <cite className="not-italic">
                    <div className="font-bold text-on-surface">{study.author}</div>
                    <div className="text-sm text-on-surface-variant">{study.role}, {study.business}</div>
                  </cite>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden primary-gradient py-24 px-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-4xl text-center text-white">
          <h2 className="text-4xl font-bold sm:text-5xl">Ready to write your own success story?</h2>
          <p className="mt-6 text-xl text-on-primary/70">
            Join 500+ businesses collecting more 5-star reviews. Start free, no credit card required.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-primary-container/30 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Start Free Trial
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

