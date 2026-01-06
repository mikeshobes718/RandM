"use client";

import Link from "next/link";
import { useState } from "react";

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

const CATEGORIES = [
  { label: "Bars", value: "bar" },
  { label: "Gyms", value: "gym" },
  { label: "Restaurants", value: "restaurant" },
  { label: "Spas", value: "spa" },
  { label: "Dentists", value: "dental_clinic" },
];

const COUNTRIES = [
  { label: "USA", value: "US" },
  { label: "Canada", value: "CA" },
  { label: "UK", value: "GB" },
  { label: "Australia", value: "AU" },
];

const STATES: Record<string, { label: string, value: string }[]> = {
  US: [
    { label: "New York", value: "NY" },
    { label: "Florida", value: "FL" },
    { label: "California", value: "CA" },
    { label: "Texas", value: "TX" },
    { label: "Illinois", value: "IL" },
    { label: "Georgia", value: "GA" },
  ],
  CA: [{ label: "Ontario", value: "ON" }, { label: "British Columbia", value: "BC" }],
  GB: [{ label: "England", value: "ENG" }],
  AU: [{ label: "New South Wales", value: "NSW" }],
};

const CITIES: Record<string, string[]> = {
  NY: ["New York City", "Brooklyn", "Queens", "Buffalo", "Rochester"],
  FL: ["Miami", "Orlando", "Tampa", "Fort Lauderdale", "Jacksonville"],
  CA: ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose"],
  TX: ["Houston", "Austin", "Dallas", "San Antonio", "Fort Worth"],
  IL: ["Chicago", "Naperville", "Aurora"],
  GA: ["Atlanta", "Savannah", "Marietta"],
  ON: ["Toronto", "Ottawa", "Mississauga"],
  BC: ["Vancouver", "Victoria", "Burnaby"],
  ENG: ["London", "Manchester", "Birmingham", "Liverpool"],
  NSW: ["Sydney", "Newcastle", "Wollongong"],
};

export default function SalesPortal() {
  const [country, setCountry] = useState("US");
  const [state, setState] = useState("NY");
  const [city, setCity] = useState("New York City");
  const [type, setType] = useState("bar");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return;
    setLoading(true);
    setSearched(true);
    try {
      const location = `${city}, ${state}, ${country}`;
      const res = await fetch(`/api/sales/lead-finder?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}&type=${type}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error("Lead search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!city) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/sales/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, state, country, type })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Database updated! Found ${data.count} new leads for ${city}.`);
        handleSearch({ preventDefault: () => {} } as any);
      }
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

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

        {/* Lead Finder Tool */}
        <section className="mb-16">
          <div className="bg-white p-8 rounded-[32px] border border-brand/20 shadow-2xl shadow-brand/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Reputation Lead Finder</h2>
                  <p className="text-sm text-muted">Select location and category to find businesses with low ratings (≤ 4.2).</p>
                </div>
              </div>

              <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
                <select 
                  value={country}
                  onChange={(e) => {
                    const c = e.target.value;
                    setCountry(c);
                    const firstState = STATES[c]?.[0]?.value || "";
                    setState(firstState);
                    setCity(CITIES[firstState]?.[0] || "");
                  }}
                  className="h-14 px-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-bold shadow-sm bg-white"
                >
                  {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>

                <select 
                  value={state}
                  onChange={(e) => {
                    const s = e.target.value;
                    setState(s);
                    setCity(CITIES[s]?.[0] || "");
                  }}
                  className="h-14 px-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-bold shadow-sm bg-white"
                >
                  {STATES[country]?.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>

                <select 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-14 px-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-bold shadow-sm bg-white"
                >
                  {CITIES[state]?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="h-14 px-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-bold shadow-sm bg-white"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>

                <div className="flex gap-2 lg:col-span-1">
                  <button 
                    type="submit"
                    disabled={loading || syncing}
                    className="flex-1 h-14 bg-brand hover:bg-brand-strong text-white font-black rounded-2xl shadow-xl shadow-brand/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap px-4"
                  >
                    {loading ? '...' : 'Find Leads'}
                  </button>
                  <button 
                    type="button"
                    onClick={handleSync}
                    disabled={loading || syncing || !city}
                    className="w-14 h-14 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-2xl border border-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center"
                    title="Sync DB"
                  >
                    <svg className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </form>

              {loading && (
                <div className="flex flex-col items-center justify-center py-12 animate-pulse">
                  <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-500 font-medium">Scanning Google for potential leads...</p>
                </div>
              )}

              {!loading && searched && leads.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-500">No low-rated businesses found for this search. Try another location or industry!</p>
                </div>
              )}

              {!loading && leads.length > 0 && (
                <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {leads.map((lead) => (
                    <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-brand/20 hover:shadow-lg transition-all group">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900 group-hover:text-brand transition-colors">{lead.name}</h4>
                          <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">Potential Lead</span>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {lead.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div className="text-center border-r border-slate-100 pr-6">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Rating</p>
                          <p className="text-2xl font-black text-red-500 leading-none">{lead.rating}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Reviews</p>
                          <p className="text-2xl font-black text-slate-900 leading-none">{lead.reviewCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

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

