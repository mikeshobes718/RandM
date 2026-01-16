"use client";

import Link from "next/link";

const PORTALS = [
  {
    name: "Sales Portal",
    description: "Main interface for sales reps to find leads and log calls.",
    link: "/sales-portal",
    icon: "📞",
    badge: "Active",
    badgeColor: "bg-emerald-50 text-emerald-600"
  },
  {
    name: "Admin Dashboard",
    description: "Management overview, metrics, and system control.",
    link: "/admin",
    icon: "🛡️",
    badge: "Internal",
    badgeColor: "bg-indigo-50 text-indigo-600"
  },
  {
    name: "Customer Dashboard",
    description: "Standard user view for business owners.",
    link: "/dashboard",
    icon: "🏢",
    badge: "Public",
    badgeColor: "bg-slate-100 text-slate-600"
  },
  {
    name: "Review Landing",
    description: "The public page customers see when scanning QR codes.",
    link: "/r/preview",
    icon: "⭐",
    badge: "Live",
    badgeColor: "bg-emerald-50 text-emerald-600"
  },
  {
    name: "Support Desk",
    description: "Handle incoming queries and help tickets.",
    link: "/admin/support",
    icon: "🎧",
    badge: "Beta",
    badgeColor: "bg-amber-50 text-amber-600"
  }
];

export default function AdminPortals() {
  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Portals</h1>
          <p className="text-slate-500 font-medium mt-1">Quick access to all operational interfaces and links.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PORTALS.map((portal) => (
          <Link 
            key={portal.name}
            href={portal.link}
            className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:scale-[1.02] hover:border-brand/20 transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-3xl bg-slate-50 flex items-center justify-center text-2xl group-hover:bg-brand/5 group-hover:scale-110 transition-all duration-500">
                {portal.icon}
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-black/5 ${portal.badgeColor}`}>
                {portal.badge}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{portal.name}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">
              {portal.description}
            </p>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand group-hover:gap-3 transition-all">
              Enter Portal
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-4">Enterprise Controls</h2>
          <p className="text-slate-400 font-medium max-w-xl mb-8">
            Access restricted backend settings, API keys, and environment variables. Unauthorized access to these portals is strictly monitored.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/admin/settings" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
              Global Settings
            </Link>
            <Link href="/admin/logs" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
              Audit Logs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
