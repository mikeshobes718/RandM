"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';

// Simple Tooltip component
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
  <div className="group relative inline-block w-full">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-normal w-48 text-center shadow-xl border border-white/10 uppercase tracking-widest leading-relaxed">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
    </div>
  </div>
);

interface Lead {
  id: string;
  dbId?: string;
  name: string;
  address: string;
  rating?: number;
  phone?: string;
  website?: string;
  timesCalled: number;
  callStatus: string;
  lastCalledByEmail?: string;
}

// Sales Assets data
const ASSETS = [
  { name: "One-Page Overview.pdf", description: "Quick summary of the value proposition.", link: "/One_Page_Overview.pdf" },
  { name: "Path to Authentic Growth.pdf", description: "Visual guide to the compliant feedback process.", link: "/Path_to_Authentic_Growth.pdf" },
  { name: "Pricing Guide.pdf", description: "Standard pricing and enterprise options.", link: "/Pricing_Guide.pdf" },
];

const OBJECTIONS = [
  { 
    title: "It's too expensive", 
    response: "Think of it as an insurance policy for your reputation. One bad review can cost you thousands in lost business. For the price of a few coffees, you can protect your rating and recover unhappy customers privately." 
  },
  { 
    title: "We already get good reviews", 
    response: "That's great! Our tool helps you automate that success so you get reviews every single day, not just when you remember to ask. It also captures the private feedback from people who wouldn't normally say anything." 
  },
  { 
    title: "Is it compliant with Google?", 
    response: "Yes, 100%. We don’t incentivize or filter reviews—customers choose what to share. We provide a direct path for praise to Google and a private channel for feedback, fully aligned with Google's latest policies." 
  }
];

const SCRIPTS = [
  {
    name: "Standard Intro",
    script: "Hi [Name], I'm [My Name] from Reviews & Marketing. I noticed your business has a great reputation, but it looks like you haven't had a new Google review in a while. Most businesses wait for bad reviews to happen. We help you build a 'moat' around your rating. Our smart QR codes help you listen—providing a direct path to Google reviews or a private feedback channel to fix issues before they become public."
  },
  {
    name: "The 'Revenue Leak' Angle",
    script: "Did you know that 90% of customers won't return after a bad experience, but most won't tell you to your face? They just leave a 1-star review later. Our tool plugs that leak by giving them a private way to vent to you directly, so you can save the customer and keep your public rating perfect."
  }
];

// Location data for dropdowns
const LOCATIONS: Record<string, Record<string, string[]>> = {
  US: {
    NY: ["All Cities", "New York", "Brooklyn", "Buffalo", "Rochester", "Albany", "Syracuse", "Yonkers", "Utica", "White Plains", "Troy", "Binghamton"],
    CA: ["All Cities", "Los Angeles", "San Diego", "San Francisco", "San Jose", "Sacramento", "Oakland", "Fresno", "Long Beach", "Santa Ana", "Anaheim"],
    TX: ["All Cities", "Houston", "Austin", "Dallas", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo"],
    FL: ["All Cities", "Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee", "Fort Lauderdale", "St. Petersburg", "Hialeah", "Port St. Lucie", "Cape Coral"],
    IL: ["All Cities", "Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield", "Elgin", "Peoria", "Champaign", "Waukegan"],
    GA: ["All Cities", "Atlanta", "Augusta", "Columbus", "Savannah", "Athens", "Sandy Springs", "Roswell", "Macon", "Johns Creek", "Albany"],
    PA: ["All Cities", "Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "Altoona"],
    OH: ["All Cities", "Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown", "Lorain"],
    NC: ["All Cities", "Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Concord"],
    MI: ["All Cities", "Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor", "Flint", "Dearborn", "Livonia", "Troy"],
    NJ: ["All Cities", "Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Woodbridge", "Lakewood", "Toms River", "Hamilton", "Trenton"],
    WA: ["All Cities", "Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Federal Way", "Yakima"],
    AZ: ["All Cities", "Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe", "Peoria", "Surprise"],
    MA: ["All Cities", "Boston", "Worcester", "Springfield", "Cambridge", "Lowell", "Brockton", "Quincy", "Lynn", "New Bedford", "Fall River"],
    TN: ["All Cities", "Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro", "Franklin", "Jackson", "Johnson City", "Bartlett"]
  },
  CA: {
    ON: ["All Cities", "Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan", "Kitchener", "Windsor"],
    BC: ["All Cities", "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley", "Coquitlam", "Abbotsford", "North Vancouver", "West Vancouver", "Victoria"],
    QC: ["All Cities", "Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Saguenay", "Lévis", "Trois-Rivières", "Terrebonne"],
    AB: ["All Cities", "Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert", "Medicine Hat", "Grande Prairie", "Airdrie", "Spruce Grove", "Leduc"]
  }
};

export default function SalesPortalPage() {
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("customer");
  const [userRepId, setUserRepId] = useState<string | null>(null);
  const [repId, setRepId] = useState("");
  const [userUid, setUserUid] = useState<string | null>(null);
  const [city, setCity] = useState("All Cities");
  const [state, setState] = useState("CA");
  const [country, setCountry] = useState("US");
  const [type, setType] = useState("restaurant");
  
  // Available states and cities based on selected country
  const availableStates = country in LOCATIONS ? Object.keys(LOCATIONS[country]) : [];
  const availableCities = (country in LOCATIONS && state in LOCATIONS[country]) ? LOCATIONS[country][state] : [];
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [callOutcome, setCallOutcome] = useState("no_answer");
  const [callNotes, setCallNotes] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [loggingCall, setLoggingCall] = useState(false);
  const [stats, setStats] = useState({ callsToday: 0, appointments: 0, closes: 0 });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("lead-finder");
  const [revealingId, setRevealingId] = useState<string | null>(null);

  // Filter & Sort State
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTimesCalled, setFilterTimesCalled] = useState("all");
  const [filterRating, setFilterRating] = useState("all");

  // Sections Refs for scrolling
  const sectionRefs = {
    'lead-finder': useRef<HTMLDivElement>(null),
    'leaderboard': useRef<HTMLDivElement>(null),
    'scripts': useRef<HTMLDivElement>(null),
    'assets': useRef<HTMLDivElement>(null),
    'objections': useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    // Fetch user for display and access check
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(user => {
        setUserEmail(user?.email || "");
        setUserRole(user?.role || "customer");
        setUserRepId(user?.rep_id || null);
        setUserUid(user?.uid || null);
        
        // Use static rep_id if available, fallback to localStorage for legacy or testing
        const finalRepId = user?.rep_id || localStorage.getItem('salesRepId') || "";
        setRepId(finalRepId);
        
        if (finalRepId) {
          fetch(`/api/sales/rep-stats?repId=${finalRepId}`)
            .then(res => res.json())
            .then(statsData => setStats(statsData));
        }
      });
    
    // Fetch leaderboard
    fetch('/api/sales/leaderboard')
      .then(res => res.json())
      .then(data => setLeaderboard(data.leaderboard || []));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/sales/lead-finder?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&country=${encodeURIComponent(country)}&type=${type}`);
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error("Lead search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevealContact = async (lead: Lead) => {
    if (lead.phone) return; // Already revealed or available
    if (revealingId === lead.id) return; // Already processing
    setRevealingId(lead.id);
    try {
      const res = await fetch('/api/sales/leads/reveal-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          googlePlaceId: lead.id,
          leadData: {
            name: lead.name,
            address: lead.address,
            rating: lead.rating,
            type: type
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.phone) {
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, phone: data.phone, website: data.website } : l));
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 right-6 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-bold animate-fade-in';
        toast.textContent = '✓ Contact info revealed';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } else {
        // Show error toast
        const errorMsg = data.error || 'Failed to reveal contact. Please try again.';
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-bold animate-fade-in';
        toast.textContent = `✗ ${errorMsg}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
      }
    } catch (err) {
      console.error("Reveal contact failed:", err);
      const toast = document.createElement('div');
      toast.className = 'fixed top-20 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-bold animate-fade-in';
      toast.textContent = '✗ Network error. Please try again.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    } finally {
      setRevealingId(null);
    }
  };

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setLoggingCall(true);
    try {
      const res = await fetch('/api/sales/leads/log-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.dbId,
          googlePlaceId: selectedLead.id,
          leadData: selectedLead,
          repId: userUid || repId, // Send user's UUID for proper tracking
          outcome: callOutcome,
          notes: callNotes,
          followupDate: followupDate,
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setCallNotes("");
        setFollowupDate("");
        // Refresh leads and stats
        handleSearch({ preventDefault: () => {} } as any);
        
        // Refresh stats
        const finalRepId = repId || localStorage.getItem('salesRepId');
        if (finalRepId) {
          fetch(`/api/sales/rep-stats?repId=${finalRepId}`)
            .then(res => res.json())
            .then(statsData => setStats(statsData));
        }
        
        // Refresh leaderboard
        fetch('/api/sales/leaderboard')
          .then(res => res.json())
          .then(data => setLeaderboard(data.leaderboard || []));
      } else {
        const data = await res.json();
        alert(`Failed to save call log: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error("Failed to log call:", err);
      alert(`Error logging call: ${err.message}`);
    } finally {
      setLoggingCall(false);
    }
  };

  const scrollToSection = (id: keyof typeof sectionRefs) => {
    setActiveTab(id);
    sectionRefs[id].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredLeads = leads
    .filter(lead => {
      if (filterStatus !== "all" && lead.callStatus !== filterStatus) return false;
      if (filterRating !== "all") {
        const r = lead.rating || 0;
        if (filterRating === "low" && r > 3.5) return false;
        if (filterRating === "mid" && (r <= 3.5 || r > 4.0)) return false;
        if (filterRating === "high" && (r <= 4.0 || r > 4.2)) return false;
      }
      if (filterTimesCalled !== "all") {
        const t = lead.timesCalled || 0;
        if (filterTimesCalled === "0" && t !== 0) return false;
        if (filterTimesCalled === "1-2" && (t < 1 || t > 2)) return false;
        if (filterTimesCalled === "3+" && t < 3) return false;
      }
      return true;
    });

  return (
    <AdminGuard allowReps={true}>
      <main className="min-h-screen bg-slate-50">
        {/* Sales Header */}
        <div className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Link href="/" className="text-xl font-black text-brand tracking-tighter">R&M SALES</Link>
                {userRepId && (
                  <div className="px-3 py-1 bg-slate-900 rounded-lg shadow-sm border border-slate-800">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">ID: {userRepId}</span>
                  </div>
                )}
              </div>
              <nav className="hidden lg:flex items-center gap-6">
                {[
                  { id: 'lead-finder', label: 'Lead Finder' },
                  { id: 'leaderboard', label: 'Leaderboard' },
                  { id: 'scripts', label: 'Scripts' },
                  { id: 'assets', label: 'Assets' },
                  { id: 'objections', label: 'Objections' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => scrollToSection(tab.id as any)}
                    className={`text-xs font-black uppercase tracking-widest transition-colors ${
                      activeTab === tab.id ? 'text-brand' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged in as</p>
                <p className="text-xs font-bold text-slate-900">{userEmail}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <Tooltip text="Number of calls logged today from your account.">
              <div className="premium-card p-6 rounded-3xl bg-white h-full">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calls Today</p>
                <h3 className="text-3xl font-black text-slate-900">{stats.callsToday}</h3>
              </div>
            </Tooltip>
            <Tooltip text="Leads where 'Appointment' outcome was logged.">
              <div className="premium-card p-6 rounded-3xl bg-white h-full">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Appointments</p>
                <h3 className="text-3xl font-black text-slate-900">{stats.appointments}</h3>
              </div>
            </Tooltip>
            <Tooltip text="Leads where 'Closed' outcome was logged this month.">
              <div className="premium-card p-6 rounded-3xl bg-white h-full">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Closes This Month</p>
                <h3 className="text-3xl font-black text-slate-900">{stats.closes}</h3>
              </div>
            </Tooltip>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Column: Lead Finder */}
            <div className="lg:col-span-2 space-y-12">
              <section ref={sectionRefs['lead-finder']} className="scroll-mt-24">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Lead Finder</h2>
                    {!repId && (
                      <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 animate-pulse">
                        <span className="text-xl">⚠️</span>
                        <p className="text-xs font-black text-amber-800 uppercase tracking-tight">
                          NO REP ID ASSIGNED. Please ask management to set your REP ID in the Admin Panel to search for leads.
                        </p>
                      </div>
                    )}
                  </div>
                  <Tooltip text="Target low-rated businesses (≤ 4.2) for the best conversion rate.">
                    <p className="text-xs text-muted text-right max-w-[200px]">Find businesses with low ratings (≤ 4.2) to call.</p>
                  </Tooltip>
                </div>

                <form onSubmit={handleSearch} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 relative">
                  {!repId && <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] rounded-2xl cursor-not-allowed" title="Rep ID Required" />}
                  <select 
                    value={country} 
                    onChange={(e) => {
                      setCountry(e.target.value);
                      const newStates = Object.keys(LOCATIONS[e.target.value] || {});
                      setState(newStates[0] || "");
                      const newCities = newStates[0] ? LOCATIONS[e.target.value][newStates[0]] : [];
                      setCity(newCities[0] || "");
                    }}
                    disabled={!repId}
                    className="sales-input h-12 bg-white rounded-2xl border-slate-200 disabled:opacity-50"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                  </select>
                  <select 
                    value={state} 
                    onChange={(e) => {
                      setState(e.target.value);
                      const newCities = LOCATIONS[country][e.target.value] || [];
                      setCity(newCities[0] || "");
                    }}
                    disabled={!repId || availableStates.length === 0}
                    className="sales-input h-12 bg-white rounded-2xl border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {availableStates.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!repId || availableCities.length === 0}
                    className="sales-input h-12 bg-white rounded-2xl border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {availableCities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select 
                    value={type} onChange={(e) => setType(e.target.value)}
                    disabled={!repId}
                    className="sales-input h-12 bg-white rounded-2xl border-slate-200 disabled:opacity-50"
                  >
                    <option value="all">All Categories</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="bar">Bars & Nightlife</option>
                    <option value="dentist">Dentist</option>
                    <option value="plumber">Plumber</option>
                    <option value="hvac">HVAC</option>
                    <option value="lawyer">Lawyer</option>
                  </select>
                  <Tooltip text="Sync live local business intelligence.">
                    <button 
                      disabled={loading || !city || !state || !repId}
                      className="primary-button h-12 rounded-2xl shadow-lg shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    >
                      {loading ? "Searching..." : "Find Leads"}
                    </button>
                  </Tooltip>
                </form>

                {searched && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
                        <select 
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="text-[10px] font-bold border-none bg-slate-100 rounded-lg py-1 px-2 focus:ring-0"
                        >
                          <option value="all">Any Status</option>
                          <option value="new">New Only</option>
                          <option value="no_answer">No Answer</option>
                          <option value="callback">Callback</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Called:</span>
                        <select 
                          value={filterTimesCalled}
                          onChange={(e) => setFilterTimesCalled(e.target.value)}
                          className="text-[10px] font-bold border-none bg-slate-100 rounded-lg py-1 px-2 focus:ring-0"
                        >
                          <option value="all">Any</option>
                          <option value="0">Never</option>
                          <option value="1-2">1-2 Times</option>
                          <option value="3+">3+ Times</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating:</span>
                        <select 
                          value={filterRating}
                          onChange={(e) => setFilterRating(e.target.value)}
                          className="text-[10px] font-bold border-none bg-slate-100 rounded-lg py-1 px-2 focus:ring-0"
                        >
                          <option value="all">Any Rating</option>
                          <option value="low">Critical (≤ 3.5)</option>
                          <option value="mid">Growing (3.5 - 4.0)</option>
                          <option value="high">Premium (4.0 - 4.2)</option>
                        </select>
                      </div>
                      <div className="ml-auto text-[10px] font-bold text-slate-400">
                        {filteredLeads.length} leads found
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {filteredLeads.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-bold">No leads match your filters.</div>
                      ) : (
                        filteredLeads.map((lead) => (
                          <div key={lead.id} className="premium-card p-6 rounded-3xl bg-white border border-slate-100 hover:border-brand/30 transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-black text-slate-900 truncate">{lead.name}</h4>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                    lead.rating && lead.rating <= 3.5 ? 'bg-red-100 text-red-600' :
                                    lead.rating && lead.rating <= 4.0 ? 'bg-amber-100 text-amber-600' :
                                    'bg-emerald-100 text-emerald-600'
                                  }`}>
                                    {lead.rating} ★
                                  </span>
                                  {lead.timesCalled > 0 && (
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 uppercase tracking-widest">
                                      {lead.timesCalled}x Called
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mb-4">{lead.address}</p>
                                
                                <div className="flex flex-wrap items-center gap-4 text-[11px]">
                                  {lead.phone ? (
                                    <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-brand font-bold hover:underline">
                                      <span>📞</span> {lead.phone}
                                    </a>
                                  ) : (
                                    <button 
                                      onClick={() => handleRevealContact(lead)}
                                      disabled={revealingId === lead.id}
                                      className="text-brand font-bold flex items-center gap-2 hover:bg-brand/5 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                      {revealingId === lead.id ? (
                                        <span className="animate-pulse">Revealing...</span>
                                      ) : (
                                        <><span>🔒</span> Reveal Phone ($0.003)</>
                                      )}
                                    </button>
                                  )}
                                  
                                  {lead.website && (
                                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 font-medium hover:text-slate-600">
                                      <span>🌐</span> Website
                                    </a>
                                  )}

                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}&query_place_id=${lead.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-slate-400 font-medium hover:text-brand transition-colors"
                                  >
                                    <span>📍</span> View on Maps
                                  </a>

                                  {lead.lastCalledByEmail && (
                                    <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                      <span className="text-[9px] uppercase font-black text-slate-300">Last called by:</span>
                                      <span className="font-bold text-slate-500">{lead.lastCalledByEmail}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button 
                                onClick={() => { setSelectedLead(lead); setIsModalOpen(true); }}
                                className="secondary-button !h-12 !px-6 !text-xs !font-black !uppercase !tracking-widest"
                              >
                                Log Call
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Scripts Section */}
              <section ref={sectionRefs['scripts']} className="scroll-mt-24">
                <h2 className="text-2xl font-black tracking-tight mb-8">Proven Scripts</h2>
                <div className="grid grid-cols-1 gap-6">
                  {SCRIPTS.map((s) => (
                    <div key={s.name} className="premium-card p-8 rounded-3xl bg-white border border-slate-100">
                      <h4 className="text-[10px] font-black text-brand uppercase tracking-widest mb-4">{s.name}</h4>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"{s.script}"</p>
                      <button 
                        onClick={() => navigator.clipboard.writeText(s.script)}
                        className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand transition-colors"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Objection Handling */}
              <section ref={sectionRefs['objections']} className="scroll-mt-24">
                <h2 className="text-2xl font-black tracking-tight mb-8">Objection Handling</h2>
                <div className="space-y-4">
                  {OBJECTIONS.map((obj) => (
                    <div key={obj.title} className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                      <div className="p-6">
                        <h4 className="font-bold text-slate-900 mb-2">" {obj.title} "</h4>
                        <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 leading-relaxed">
                          <span className="font-black text-brand uppercase mr-2 text-[10px]">Response:</span>
                          {obj.response}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Sidebar */}
            <div className="space-y-12">
              {/* Leaderboard */}
              <section ref={sectionRefs['leaderboard']} className="scroll-mt-24">
                <h2 className="text-xl font-black tracking-tight mb-6">Sales Leaderboard</h2>
                <div className="premium-card rounded-[32px] bg-white overflow-hidden border border-slate-100 min-h-[450px] shadow-xl shadow-slate-200/40">
                  {leaderboard.length === 0 ? (
                    <div className="h-[450px] flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                        <span className="text-3xl">🏆</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">No active stats yet</h4>
                      <p className="text-xs font-medium text-slate-400 max-w-[180px] leading-relaxed">
                        Log your first call to claim your spot on the leaderboard!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {leaderboard.map((item, i) => (
                        <div key={item.email} className={`p-5 flex items-center justify-between transition-colors hover:bg-slate-50/50 ${i === 0 ? 'bg-brand/[0.03]' : ''}`}>
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${
                                i === 0 ? 'bg-brand text-white' : 
                                i === 1 ? 'bg-slate-200 text-slate-600' :
                                i === 2 ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-400'
                              }`}>
                                {i + 1}
                              </span>
                              {i === 0 && <span className="absolute -top-1 -right-1 text-[10px]">👑</span>}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate max-w-[140px]">{item.name || item.email.split('@')[0]}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-1.5 py-0.5 bg-brand/10 text-brand text-[9px] font-black rounded uppercase tracking-widest">
                                  {item.closes} Closes
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">{item.calls}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calls</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Demo Video */}
              <section className="scroll-mt-24">
                <h2 className="text-xl font-black tracking-tight mb-6">Demo Video</h2>
                <div className="premium-card rounded-3xl bg-slate-900 aspect-video overflow-hidden shadow-xl shadow-slate-200 relative group">
                  <iframe
                    className="w-full h-full absolute inset-0"
                    src="https://www.youtube.com/embed/y0Jb0wNecfk?rel=0&modestbranding=1"
                    title="Product Demo Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                  <div className="absolute inset-0 pointer-events-none border border-brand/5 rounded-[24px]"></div>
                </div>
                <p className="text-center text-xs text-slate-500 mt-3 font-medium">12-minute walkthrough of the perfect pitch</p>
              </section>

              {/* Sales Assets */}
              <section ref={sectionRefs['assets']} className="scroll-mt-24">
                <h2 className="text-xl font-black tracking-tight mb-6">Sales Assets</h2>
                <div className="space-y-4">
                  {ASSETS.map((asset) => (
                    <a 
                      key={asset.name} 
                      href={asset.link}
                      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-brand/30 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl group-hover:bg-brand/10 transition-colors">
                        📄
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{asset.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{asset.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Log Call Modal */}
        {isModalOpen && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{selectedLead.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Logging call for {selectedLead.id}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleLogCall} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Outcome</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'no_answer', label: 'No Answer' },
                      { id: 'callback', label: 'Callback' },
                      { id: 'appointment', label: 'Appointment' },
                      { id: 'close', label: 'Closed' }
                    ].map(o => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setCallOutcome(o.id)}
                        className={`h-12 rounded-2xl text-xs font-bold border-2 transition-all ${
                          callOutcome === o.id ? 'bg-brand/5 border-brand text-brand' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Follow-up Date</label>
                  <input 
                    type="date"
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="sales-input w-full bg-slate-50 border-none rounded-2xl h-12"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Notes</label>
                  <textarea 
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    className="sales-input w-full bg-slate-50 border-none rounded-2xl p-4 min-h-[120px] text-sm"
                    placeholder="What happened on the call? Any pain points?"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    disabled={loggingCall || !repId}
                    className="primary-button w-full h-14 rounded-2xl shadow-xl shadow-brand/20 text-sm"
                  >
                    {!repId ? "Enter Rep ID first" : loggingCall ? "Saving..." : "Save Call Log"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
