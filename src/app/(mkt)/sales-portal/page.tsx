"use client";

import Link from "next/link";

const PITCH_SCRIPTS = [
  {
    title: "The 'Google Moat' (In-Person)",
    script: "Most businesses wait for bad reviews to happen. We help you build a 'moat' around your rating. Our smart QR codes filter feedback—happy customers go to Google, unhappy ones go to a private form where you can fix the issue before it hits the internet."
  },
  {
    title: "The 'POS Automation' (Cold Call)",
    script: "I noticed you're using Square for payments. We have a direct integration that automatically emails a review request to every customer after they buy. It's reputation management on 100% autopilot."
  }
];

const ASSETS = [
  { name: "Path to Five Stars.pdf", description: "Visual guide to the review filtering process.", link: "/Path_to_Five_Stars.pdf" },
  { name: "Reputation Control Automated.pdf", description: "Deep dive into Square & POS automation.", link: "/Reputation_Control_Automated.pdf" }
];

export default function SalesPortal() {
  return (
    <main className="min-h-screen bg-slate-50 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 border-b border-slate-200 pb-8 text-center sm:text-left">
          <span className="bg-brand/10 text-brand text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4 inline-block">
            Internal Sales Enablement
          </span>
          <h1 className="text-4xl font-black text-slate-900 mb-4">Sales Toolkit</h1>
          <p className="text-slate-600 text-lg">Everything you need to close deals and grow Reviews & Marketing.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-12">
            
            {/* Explainer Video */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">01</span>
                The Perfect Demo
              </h2>
              <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/w1DEmxfCy6A" 
                  title="Reviews & Marketing Explainer"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
            </section>

            {/* Pitch Scripts */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">02</span>
                Proven Pitch Scripts
              </h2>
              <div className="grid gap-4">
                {PITCH_SCRIPTS.map(s => (
                  <div key={s.title} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-brand/30 transition-colors">
                    <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed italic">"{s.script}"</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Objection Handling */}
            <section className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 blur-3xl -mr-16 -mt-16"></div>
              <h2 className="text-xl font-bold mb-6 relative z-10">Common Objections</h2>
              <div className="space-y-6 relative z-10">
                <div>
                  <p className="font-bold text-brand mb-1">"Is this against Google's TOS?"</p>
                  <p className="text-sm text-slate-400">"We don't block reviews. We provide a private feedback channel for customers. If they choose to leave a Google review, they can always do so directly. We just make the private channel more accessible for those with complaints."</p>
                </div>
                <div>
                  <p className="font-bold text-brand mb-1">"Why not just use a standard QR code?"</p>
                  <p className="text-sm text-slate-400">"Standard QR codes don't track who scanned, where they scanned, or filter for 5-star sentiment. You lose the lead and risk a public 1-star review."</p>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            {/* Asset Downloads */}
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Sales Assets
              </h3>
              <div className="space-y-4">
                {ASSETS.map(a => (
                  <a 
                    key={a.name} 
                    href={a.link} 
                    download
                    className="group block p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                  >
                    <p className="text-sm font-bold text-slate-900 group-hover:text-brand">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.description}</p>
                  </a>
                ))}
              </div>
            </section>

            {/* Target Audience */}
            <section className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Ideal Clients
              </h3>
              <ul className="space-y-2 text-sm text-indigo-800">
                <li className="flex items-center gap-2">• Local Franchises</li>
                <li className="flex items-center gap-2">• Medical/Dental Offices</li>
                <li className="flex items-center gap-2">• High-Traffic Restaurants</li>
                <li className="flex items-center gap-2">• Boutique Gyms</li>
              </ul>
            </section>

            {/* Plan Shortcuts */}
            <Link 
              href="/pricing"
              className="block bg-brand p-6 rounded-3xl text-white shadow-xl shadow-brand/20 hover:scale-[1.02] transition-transform"
            >
              <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Pricing Cheat Sheet</p>
              <p className="text-xl font-bold leading-tight">Compare Starter vs Pro vs Unlimited →</p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

