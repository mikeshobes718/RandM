import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 mesh-bg">
      <section className="relative overflow-hidden pt-20 pb-10">
        <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)] bg-gradient-to-b from-blue-100/60 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/70 text-blue-800 text-sm font-medium mb-6 shadow ring-1 ring-blue-200">Our Story</span>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">About Reviews & Marketing</h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            We help local businesses turn happy customers into lasting reputation. Our platform simplifies collecting reviews, sharing smart links, printing beautiful QR codes, and measuring real impact.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">10,000+</div>
            <p className="text-gray-600 mt-2">Reviews collected across our customers</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">500+</div>
            <p className="text-gray-600 mt-2">Businesses using our tools</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition">
            <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">4.9/5</div>
            <p className="text-gray-600 mt-2">Average satisfaction rating</p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 gradient-border">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              We build simple, powerful tools so owners can focus on service while technology quietly grows their reputation. From first scan to five stars, we streamline every step.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 gradient-border">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">What We Value</h2>
            <ul className="text-gray-600 space-y-2 leading-relaxed list-disc list-inside">
              <li>Clarity over complexity</li>
              <li>Privacy & security by default</li>
              <li>Measurable outcomes for every feature</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to see it in action?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all">Get Started Free</Link>
            <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10">Talk to Sales</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
