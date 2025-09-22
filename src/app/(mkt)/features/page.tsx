export const dynamic = 'force-static';

import Link from "next/link";
import { FeatureTabs } from "@/components/FeatureTabs";

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 mesh-bg">
      {/* Header comes from RootLayout */}

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-12">
        <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)] bg-gradient-to-b from-blue-100/70 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Everything you need to grow 5★ reviews
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A focused toolkit to capture more Google reviews with less effort: share links,
              QR codes, automation, and clean analytics.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="neon-button inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium">
              Get Started Free
            </Link>
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50">
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Product Pillars */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="rounded-2xl p-8 bg-white border border-gray-100 shadow-sm hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white grid place-content-center mb-5">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Share Links</h3>
              <p className="text-gray-600 leading-relaxed">One-tap links that route customers directly to your Google review form. Branded, trackable, and dead-simple to share.</p>
            </div>
            <div className="rounded-2xl p-8 bg-white border border-gray-100 shadow-sm hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white grid place-content-center mb-5">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Printable QR Codes</h3>
              <p className="text-gray-600 leading-relaxed">Instant QR posters and table tents. Customers scan and leave a review in under 30 seconds.</p>
            </div>
            <div className="rounded-2xl p-8 bg-white border border-gray-100 shadow-sm hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white grid place-content-center mb-5">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Clean Analytics</h3>
              <p className="text-gray-600 leading-relaxed">See scans, clicks, and reviews over time. Attribute what’s working and double down.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Feature Groups */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl p-8 bg-white border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-semibold mb-4">Automation that nudges politely</h3>
              <p className="text-gray-600 leading-relaxed mb-6">Send review requests after visits and follow up automatically. Personalization tokens keep it human, not spammy.</p>
              <ul className="space-y-3 text-gray-700">
                <li>• Scheduled follow-ups with quiet hours</li>
                <li>• Opt-out links and bounce handling</li>
                <li>• Templates that match your brand voice</li>
              </ul>
            </div>
            <div className="rounded-2xl p-8 bg-white border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-semibold mb-4">Design that feels like your brand</h3>
              <p className="text-gray-600 leading-relaxed mb-6">Customize colors, logos, and landing copy. Use your domain so the experience feels trustworthy end-to-end.</p>
              <ul className="space-y-3 text-gray-700">
                <li>• Brand colors and typography</li>
                <li>• Custom domains and link slugs</li>
                <li>• Upload-ready QR print assets</li>
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <FeatureTabs />
          </div>
        </div>
      </section>

      {/* Compare Plans strip */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">Compare plans</h3>
              <p className="text-gray-600">See which plan fits your growth stage.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 text-gray-700">
                <span className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">Starter</span>
                <span className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">Pro</span>
                <span className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">Enterprise</span>
              </div>
              <Link href="/pricing" className="neon-button inline-flex items-center justify-center px-5 py-3 rounded-xl font-medium">Go to Pricing</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">See it in action</h2>
          <p className="text-blue-100 text-lg mb-8">Start free and collect your first reviews this week.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all">Get Started Free</Link>
            <Link href="/dashboard" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10">View Dashboard</Link>
          </div>
        </div>
      </section>

      {/* Footer from RootLayout */}
    </main>
  );
}
