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
  { label: "Restaurants", value: "restaurant" },
  { label: "Gyms", value: "gym" },
  { label: "Spas", value: "spa" },
  { label: "Dentists", value: "dental_clinic" },
  { label: "Hair Salons", value: "hair_salon" },
  { label: "Auto Repair", value: "auto_repair" },
  { label: "Plumbers", value: "plumber" },
  { label: "Electricians", value: "electrician" },
  { label: "Lawyers", value: "lawyer" },
  { label: "Accountants", value: "accountant" },
  { label: "Real Estate", value: "real_estate_agency" },
  { label: "Car Dealers", value: "car_dealer" },
  { label: "Furniture Stores", value: "furniture_store" },
  { label: "Clothing Stores", value: "clothing_store" },
  { label: "Jewelry Stores", value: "jewelry_store" },
  { label: "Bakeries", value: "bakery" },
  { label: "Cafes", value: "cafe" },
  { label: "Pizza Restaurants", value: "pizza_restaurant" },
  { label: "Fast Food", value: "fast_food_restaurant" },
  { label: "Hotels", value: "hotel" },
  { label: "Pet Stores", value: "pet_store" },
  { label: "Veterinarians", value: "veterinary_care" },
  { label: "Pharmacies", value: "pharmacy" },
  { label: "Medical Clinics", value: "medical_clinic" },
  { label: "Hospitals", value: "hospital" },
  { label: "Chiropractors", value: "chiropractor" },
  { label: "Physical Therapy", value: "physical_therapy" },
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
    { label: "California", value: "CA" },
    { label: "Texas", value: "TX" },
    { label: "Florida", value: "FL" },
    { label: "Illinois", value: "IL" },
    { label: "Pennsylvania", value: "PA" },
    { label: "Ohio", value: "OH" },
    { label: "Georgia", value: "GA" },
    { label: "North Carolina", value: "NC" },
    { label: "Michigan", value: "MI" },
    { label: "New Jersey", value: "NJ" },
    { label: "Virginia", value: "VA" },
    { label: "Washington", value: "WA" },
    { label: "Arizona", value: "AZ" },
    { label: "Massachusetts", value: "MA" },
    { label: "Tennessee", value: "TN" },
    { label: "Indiana", value: "IN" },
    { label: "Missouri", value: "MO" },
    { label: "Maryland", value: "MD" },
    { label: "Wisconsin", value: "WI" },
    { label: "Colorado", value: "CO" },
    { label: "Minnesota", value: "MN" },
    { label: "South Carolina", value: "SC" },
    { label: "Alabama", value: "AL" },
    { label: "Louisiana", value: "LA" },
    { label: "Kentucky", value: "KY" },
    { label: "Oregon", value: "OR" },
    { label: "Oklahoma", value: "OK" },
    { label: "Connecticut", value: "CT" },
    { label: "Utah", value: "UT" },
    { label: "Iowa", value: "IA" },
    { label: "Nevada", value: "NV" },
    { label: "Arkansas", value: "AR" },
    { label: "Mississippi", value: "MS" },
    { label: "Kansas", value: "KS" },
    { label: "New Mexico", value: "NM" },
    { label: "Nebraska", value: "NE" },
    { label: "West Virginia", value: "WV" },
    { label: "Idaho", value: "ID" },
    { label: "Hawaii", value: "HI" },
    { label: "New Hampshire", value: "NH" },
    { label: "Maine", value: "ME" },
    { label: "Rhode Island", value: "RI" },
    { label: "Montana", value: "MT" },
    { label: "Delaware", value: "DE" },
    { label: "South Dakota", value: "SD" },
    { label: "North Dakota", value: "ND" },
    { label: "Alaska", value: "AK" },
    { label: "Vermont", value: "VT" },
    { label: "Wyoming", value: "WY" },
  ],
  CA: [{ label: "Ontario", value: "ON" }, { label: "British Columbia", value: "BC" }],
  GB: [{ label: "England", value: "ENG" }],
  AU: [{ label: "New South Wales", value: "NSW" }],
};

const CITIES: Record<string, string[]> = {
  NY: ["New York City", "Brooklyn", "Queens", "Buffalo", "Rochester", "Albany", "Syracuse", "Yonkers", "Utica", "White Plains"],
  CA: ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "San Jose", "Oakland", "Fresno", "Long Beach", "Anaheim", "Santa Ana"],
  TX: ["Houston", "Austin", "Dallas", "San Antonio", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo"],
  FL: ["Miami", "Orlando", "Tampa", "Fort Lauderdale", "Jacksonville", "Tallahassee", "St. Petersburg", "Hialeah", "Port St. Lucie", "Cape Coral"],
  IL: ["Chicago", "Naperville", "Aurora", "Rockford", "Joliet", "Springfield", "Peoria", "Elgin", "Waukegan", "Cicero"],
  PA: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "Altoona"],
  OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown", "Lorain"],
  GA: ["Atlanta", "Savannah", "Marietta", "Augusta", "Columbus", "Athens", "Sandy Springs", "Roswell", "Macon", "Johns Creek"],
  NC: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Concord"],
  MI: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor", "Flint", "Dearborn", "Livonia", "Troy"],
  NJ: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Woodbridge", "Lakewood", "Toms River", "Hamilton", "Trenton"],
  VA: ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Alexandria", "Hampton", "Portsmouth", "Suffolk", "Roanoke"],
  WA: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Yakima", "Federal Way"],
  AZ: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe", "Peoria", "Surprise"],
  MA: ["Boston", "Worcester", "Springfield", "Lowell", "Cambridge", "New Bedford", "Brockton", "Quincy", "Lynn", "Fall River"],
  TN: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Murfreesboro", "Franklin", "Jackson", "Johnson City", "Bartlett", "Hendersonville"],
  IN: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Fishers", "Bloomington", "Hammond", "Gary", "Muncie"],
  MO: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence", "Lee's Summit", "O'Fallon", "St. Joseph", "St. Charles", "St. Peters"],
  MD: ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Bowie", "Annapolis", "College Park", "Salisbury", "Laurel", "Greenbelt"],
  WI: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton", "Waukesha", "Oshkosh", "Eau Claire", "Janesville"],
  CO: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada", "Westminster", "Pueblo", "Centennial"],
  MN: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington", "Brooklyn Park", "Plymouth", "St. Cloud", "Eagan", "Woodbury"],
  SC: ["Charleston", "Columbia", "North Charleston", "Mount Pleasant", "Rock Hill", "Greenville", "Summerville", "Sumter", "Hilton Head Island", "Florence"],
  AL: ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa", "Hoover", "Dothan", "Auburn", "Decatur", "Madison"],
  LA: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles", "Kenner", "Bossier City", "Monroe", "Alexandria", "Houma"],
  KY: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington", "Hopkinsville", "Richmond", "Florence", "Georgetown", "Henderson"],
  OR: ["Portland", "Eugene", "Salem", "Gresham", "Hillsboro", "Bend", "Beaverton", "Medford", "Springfield", "Corvallis"],
  OK: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Lawton", "Edmond", "Moore", "Midwest City", "Enid", "Stillwater"],
  CT: ["Bridgeport", "New Haven", "Hartford", "Stamford", "Waterbury", "Norwalk", "Danbury", "New Britain", "West Hartford", "Greenwich"],
  UT: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem", "Sandy", "Ogden", "St. George", "Layton", "Taylorsville"],
  IA: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City", "Waterloo", "Council Bluffs", "Ames", "West Des Moines", "Dubuque"],
  NV: ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks", "Carson City", "Fernley", "Elko", "Mesquite", "Boulder City"],
  AR: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro", "North Little Rock", "Conway", "Rogers", "Pine Bluff", "Bentonville"],
  MS: ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi", "Meridian", "Tupelo", "Greenville", "Olive Branch", "Horn Lake"],
  KS: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka", "Lawrence", "Shawnee", "Manhattan", "Lenexa", "Salina"],
  NM: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell", "Farmington", "Clovis", "Hobbs", "Alamogordo", "Carlsbad"],
  NE: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney", "Fremont", "Hastings", "North Platte", "Norfolk", "Columbus"],
  WV: ["Charleston", "Huntington", "Parkersburg", "Morgantown", "Wheeling", "Martinsburg", "Fairmont", "Beckley", "Clarksburg", "South Charleston"],
  ID: ["Boise", "Nampa", "Meridian", "Idaho Falls", "Pocatello", "Caldwell", "Coeur d'Alene", "Twin Falls", "Lewiston", "Post Falls"],
  HI: ["Honolulu", "Pearl City", "Hilo", "Kailua", "Kaneohe", "Kahului", "Ewa Beach", "Mililani", "Kihei", "Makakilo"],
  NH: ["Manchester", "Nashua", "Concord", "Derry", "Rochester", "Dover", "Salem", "Merrimack", "Londonderry", "Hudson"],
  ME: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn", "Biddeford", "Sanford", "Saco", "Augusta", "Westbrook"],
  RI: ["Providence", "Warwick", "Cranston", "Pawtucket", "East Providence", "Woonsocket", "Newport", "Central Falls", "Westerly", "Cumberland"],
  MT: ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte", "Helena", "Kalispell", "Havre", "Anaconda", "Miles City"],
  DE: ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna", "Milford", "Seaford", "Georgetown", "Elsmere", "Laurel"],
  SD: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown", "Mitchell", "Yankton", "Pierre", "Huron", "Vermillion"],
  ND: ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo", "Williston", "Dickinson", "Mandan", "Jamestown", "Wahpeton"],
  AK: ["Anchorage", "Fairbanks", "Juneau", "Wasilla", "Sitka", "Ketchikan", "Kenai", "Kodiak", "Bethel", "Palmer"],
  VT: ["Burlington", "Essex", "South Burlington", "Colchester", "Rutland", "Montpelier", "Barre", "St. Albans", "Brattleboro", "Milton"],
  WY: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs", "Sheridan", "Green River", "Evanston", "Riverton", "Jackson"],
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
  const [repId, setRepId] = useState("rep_" + Math.random().toString(36).substring(2, 7));
  const [copied, setCopied] = useState(false);

  // Call Tracking Modal State
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [callOutcome, setCallOutcome] = useState("no answer");
  const [callNotes, setCallNotes] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [loggingCall, setLoggingCall] = useState(false);

  // Filter & Sort State
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTimesCalled, setFilterTimesCalled] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("rating_low");

  const referralLink = `https://www.reviewsandmarketing.com/register?ref=${repId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    console.log('[LOG CALL] Selected Lead:', selectedLead);
    setLoggingCall(true);
    try {
      const res = await fetch('/api/sales/leads/log-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLead.dbId,
          googlePlaceId: selectedLead.id,
          leadData: selectedLead,
          repId: repId, // Using the random repId for now
          outcome: callOutcome,
          notes: callNotes,
          followupDate: followupDate,
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setCallNotes("");
        setFollowupDate("");
        // Refresh leads to show updated status
        handleSearch({ preventDefault: () => {} } as any);
      } else {
        const data = await res.json();
        alert(`Failed to save call log: ${data.error || 'Unknown error'}\n\nPayload sent: ${JSON.stringify({
          leadId: selectedLead.dbId,
          googlePlaceId: selectedLead.id,
          repId: repId
        }, null, 2)}`);
      }
    } catch (err: any) {
      console.error("Failed to log call:", err);
      alert(`Error logging call: ${err.message}`);
    } finally {
      setLoggingCall(false);
    }
  };

  const filteredLeads = leads
    .filter(lead => {
      if (filterStatus !== "all" && lead.callStatus !== filterStatus) return false;
      if (filterRating !== "all") {
        const r = lead.rating;
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
    })
    .sort((a, b) => {
      if (sortBy === "rating_low") return a.rating - b.rating;
      if (sortBy === "last_called") return new Date(b.lastCalledAt || 0).getTime() - new Date(a.lastCalledAt || 0).getTime();
      if (sortBy === "followup") return new Date(a.nextFollowup || '9999').getTime() - new Date(b.nextFollowup || '9999').getTime();
      return 0;
    });

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
          <h1 className="text-4xl font-black text-slate-900 mb-4">Sales Toolkit</h1>
          <p className="text-slate-600 text-lg font-medium">Everything you need to close deals and track your earnings.</p>
        </div>

        {/* Stats & Personal Dashboard */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Calls Logged</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black text-slate-900">142</p>
              <p className="text-emerald-500 text-sm font-bold mb-1.5">↑ 12%</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Closes This Week</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black text-slate-900">8</p>
              <p className="text-emerald-500 text-sm font-bold mb-1.5">Goal: 10</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Commission Earned</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black text-brand">$2,450.00</p>
              <p className="text-slate-400 text-xs font-bold mb-1.5">Pending: $450</p>
            </div>
          </div>
        </section>

        {/* Lead Finder Tool */}
        <section className="mb-16">
          <div className="bg-white p-8 rounded-[32px] border border-brand/20 shadow-2xl shadow-brand/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Reputation Lead Finder</h2>
                    <p className="text-sm text-muted">Find businesses with low ratings (≤ 4.2) to call.</p>
                  </div>
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

              {/* Filters & Sorting */}
              {leads.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">Filter:</span>
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold focus:outline-none bg-white"
                    >
                      <option value="all">All Statuses</option>
                      <option value="fresh">Fresh</option>
                      <option value="no answer">No Answer</option>
                      <option value="callback">Callback</option>
                      <option value="not interested">Not Interested</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select 
                      value={filterTimesCalled}
                      onChange={(e) => setFilterTimesCalled(e.target.value)}
                      className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold focus:outline-none bg-white"
                    >
                      <option value="all">Any Attempts</option>
                      <option value="0">0 Calls</option>
                      <option value="1-2">1-2 Calls</option>
                      <option value="3+">3+ Calls</option>
                    </select>
                    <select 
                      value={filterRating}
                      onChange={(e) => setFilterRating(e.target.value)}
                      className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold focus:outline-none bg-white"
                    >
                      <option value="all">Any Rating</option>
                      <option value="low">Below 3.5</option>
                      <option value="mid">3.5 - 4.0</option>
                      <option value="high">4.0 - 4.2</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[10px] font-black uppercase text-slate-400">Sort:</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold focus:outline-none bg-white"
                    >
                      <option value="rating_low">Rating (Low First)</option>
                      <option value="last_called">Last Called</option>
                      <option value="followup">Next Follow-up</option>
                    </select>
                  </div>
                </div>
              )}

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
                <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredLeads.map((lead) => (
                    <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-brand/20 hover:shadow-lg transition-all group relative">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <a 
                            href={lead.googleMapsUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-bold text-slate-900 group-hover:text-brand transition-colors hover:underline flex items-center gap-1.5"
                          >
                            {lead.name}
                            <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            lead.callStatus === 'closed' ? 'bg-emerald-100 text-emerald-600' :
                            lead.callStatus === 'callback' ? 'bg-amber-100 text-amber-600' :
                            lead.callStatus === 'not interested' ? 'bg-slate-200 text-slate-600' :
                            lead.callStatus === 'no answer' ? 'bg-red-50 text-red-500' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {lead.callStatus || 'fresh'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mb-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {lead.address}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          {lead.phone && (
                            <p className="text-sm font-bold text-slate-700 flex items-center gap-1">
                              <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {lead.phone}
                            </p>
                          )}
                          {lead.website && (
                            <a 
                              href={lead.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-brand hover:underline flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              Website
                            </a>
                          )}
                        </div>

                        {/* Call Stats Row */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black uppercase text-slate-400">Attempts:</span>
                            <span className="text-xs font-bold text-slate-700">{lead.timesCalled || 0}</span>
                          </div>
                          {lead.lastCalledAt && (
                            <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                              <span className="text-[10px] font-black uppercase text-slate-400">Last:</span>
                              <span className="text-xs font-bold text-slate-700">{new Date(lead.lastCalledAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          {lead.nextFollowup && (
                            <div className="flex items-center gap-1 border-l border-slate-200 pl-4 bg-amber-50 px-2 py-0.5 rounded">
                              <span className="text-[10px] font-black uppercase text-amber-600">Follow-up:</span>
                              <span className="text-xs font-black text-amber-700">{new Date(lead.nextFollowup).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center gap-3">
                        <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <div className="text-center border-r border-slate-100 pr-4">
                            <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Rating</p>
                            <p className="text-xl font-black text-red-500 leading-none">{lead.rating}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Reviews</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{lead.reviewCount}</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsModalOpen(true);
                            setCallOutcome(lead.callStatus === 'fresh' ? 'no answer' : lead.callStatus);
                          }}
                          className="w-full h-10 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 px-4 shadow-lg shadow-slate-900/10 group-hover:scale-105"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Log Call
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Unique Referral Link Generator */}
        <section className="mb-16">
          <div className="bg-slate-900 rounded-[32px] p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand/20 to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Your Unique Sign-up Link</h2>
                <p className="text-slate-400 font-medium">Use this link to register new clients. We track every sign-up automatically to your account.</p>
              </div>
              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch gap-3">
                <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-4 min-w-[300px]">
                  <code className="text-brand-light font-mono text-sm truncate">{referralLink}</code>
                  <button 
                    onClick={copyToClipboard}
                    className="text-white/60 hover:text-white transition-colors p-1"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="bg-brand hover:bg-brand-strong text-white font-black px-8 h-12 sm:h-auto rounded-2xl transition-all shadow-lg shadow-brand/20 whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
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
            {/* Leaderboard */}
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Top Closers
              </h3>
              <div className="space-y-3">
                {[
                  { name: "Sarah J.", closes: 42, color: "bg-emerald-100 text-emerald-700" },
                  { name: "Mike S.", closes: 38, color: "bg-blue-100 text-blue-700" },
                  { name: "David R.", closes: 31, color: "bg-slate-100 text-slate-700" }
                ].map((rep, i) => (
                  <div key={rep.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-400">#{i+1}</span>
                      <p className="text-sm font-bold text-slate-900">{rep.name}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${rep.color}`}>{rep.closes} Closes</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Payout History */}
            <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Payout History
              </h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Jan 1, 2026</span>
                  <span className="font-bold text-slate-900">$1,200.00</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <span className="text-slate-500">Dec 15, 2025</span>
                  <span className="font-bold text-slate-900">$950.00</span>
                </div>
              </div>
              <div className="bg-brand/5 p-4 rounded-2xl border border-brand/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">Next Payout</p>
                <p className="text-lg font-black text-slate-900">Jan 15, 2026</p>
                <p className="text-xs font-bold text-brand mt-1">Est. $2,450.00</p>
              </div>
            </section>

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

      {/* Call Log Modal */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900">Log Call: {selectedLead.name}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleLogCall} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Outcome</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'no answer', label: 'No Answer' },
                      { id: 'left vm', label: 'Left VM' },
                      { id: 'spoke to dm', label: 'Spoke to DM' },
                      { id: 'callback', label: 'Callback' },
                      { id: 'not interested', label: 'Not Interested' },
                      { id: 'closed', label: 'Closed' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCallOutcome(opt.id)}
                        className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                          callOutcome === opt.id 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notes (Optional)</label>
                  <textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="What happened during the call?"
                    className="w-full h-24 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Next Follow-up (Optional)</label>
                  <input
                    type="date"
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="w-full h-14 px-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm font-bold shadow-sm bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loggingCall}
                  className="w-full h-14 bg-brand hover:bg-brand-strong text-white font-black rounded-2xl shadow-xl shadow-brand/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loggingCall ? 'Saving...' : 'Save Call Log'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

