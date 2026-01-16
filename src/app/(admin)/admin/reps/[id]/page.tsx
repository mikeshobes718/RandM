"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const MOCK_REP = {
  id: "1",
  name: "Maria Lopez",
  status: "Active",
  startDate: "Dec 1, 2025",
  leadsAssigned: 142,
  callsLogged: 840,
  closes: 24,
  commissionEarned: "$1,200",
  commissionOwed: "$450",
  lastActive: "2 min ago",
  email: "maria.l@example.com",
  whatsapp: "+1 234 567 8900",
  paymentMethod: "Wise",
  paymentId: "maria_wise_77",
  notes: "Top performing rep for the Northeast region. High conversion rate on dental leads.",
};

const MOCK_CLOSES = [
  { id: "c1", businessName: "Smile Dental", plan: "Pro", date: "Jan 12, 2026", amount: "$50" },
  { id: "c2", businessName: "Joe's Pizza", plan: "Unlimited", date: "Dec 10, 2025", amount: "$100" },
  { id: "c3", businessName: "Elite Body Shop", plan: "Pro", date: "Jan 5, 2026", amount: "$50" },
];

const MOCK_CALLS = [
  { id: "cl1", businessName: "Pizza Palace", date: "2 hours ago", status: "Called", notes: "No answer, left voicemail." },
  { id: "cl2", businessName: "Sparkle Dental", date: "3 hours ago", status: "Follow-up", notes: "Interested, call back Friday." },
  { id: "cl3", businessName: "Tire World", date: "Yesterday", status: "Called", notes: "Busy, call back next week." },
];

export default function AdminRepDetail() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState("Closes");

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link 
            href="/admin/reps"
            className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{MOCK_REP.name}</h1>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider">{MOCK_REP.status}</span>
            </div>
            <p className="text-slate-500 font-medium mt-1">Rep ID: {id} • Joined {MOCK_REP.startDate}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="h-14 px-8 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all">Mark Inactive</button>
          <button className="h-14 px-8 bg-red-50 text-red-600 border border-red-100 font-black rounded-2xl hover:bg-red-100 transition-all">Drop Rep</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {[
          { label: "Leads Assigned", value: MOCK_REP.leadsAssigned },
          { label: "Calls Logged", value: MOCK_REP.callsLogged },
          { label: "Total Closes", value: MOCK_REP.closes },
          { label: "Close Rate", value: ((MOCK_REP.closes / MOCK_REP.callsLogged) * 100).toFixed(1) + "%" },
          { label: "Total Earned", value: MOCK_REP.commissionEarned, color: "text-slate-900" },
          { label: "Pending Payout", value: MOCK_REP.commissionOwed, color: "text-brand" },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl border border-slate-50 shadow-lg shadow-slate-200/40">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-xl font-black ${stat.color || 'text-slate-700'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Col: Details & Notes */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-xl shadow-slate-200/40 space-y-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Contact & Payout</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Email</label>
                <p className="text-sm font-bold text-slate-700">{MOCK_REP.email}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">WhatsApp</label>
                <p className="text-sm font-bold text-slate-700">{MOCK_REP.whatsapp}</p>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Payment Method</label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md bg-slate-100 text-[10px] font-black uppercase text-slate-600">{MOCK_REP.paymentMethod}</span>
                  <p className="text-sm font-bold text-slate-900">{MOCK_REP.paymentId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-xl shadow-slate-200/40 space-y-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Tracking & Links</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Unique Referral Link</label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={`https://reviewsandmarketing.com/register?ref=rep_${id}`}
                    className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-600"
                  />
                  <button className="p-3 rounded-xl bg-brand text-white hover:scale-105 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-2m-6-6L14 7m0 0l-3-3m3 3l3 3m-3-3v10" /></svg>
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Rep Portal Access</label>
                <p className="text-xs font-bold text-slate-500">Rep can log in to their dashboard at:</p>
                <p className="text-xs font-black text-brand mt-1">reviewsandmarketing.com/sales-portal</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6">Internal Admin Notes</h3>
            <textarea 
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand/50 resize-none outline-none transition-all"
              defaultValue={MOCK_REP.notes}
            ></textarea>
            <button className="w-full mt-4 py-4 rounded-xl bg-brand text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
              Save Notes
            </button>
          </div>
        </div>

        {/* Right Col: Activity Tabs */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-50 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center gap-8">
            {["Closes", "Call Log", "Commission History"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === tab ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-brand rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="p-0">
            {activeTab === 'Closes' && (
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-8 py-4">Customer</th>
                    <th className="px-4 py-4">Plan</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-8 py-4 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {MOCK_CLOSES.map(close => (
                    <tr key={close.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-900">{close.businessName}</td>
                      <td className="px-4 py-5 font-bold text-slate-600 text-xs">{close.plan}</td>
                      <td className="px-4 py-5 text-slate-500 text-sm font-medium">{close.date}</td>
                      <td className="px-8 py-5 text-right font-black text-emerald-500">{close.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'Call Log' && (
              <div className="p-8 space-y-6">
                {MOCK_CALLS.map(call => (
                  <div key={call.id} className="flex gap-4 p-4 rounded-3xl border border-slate-50 hover:bg-slate-50 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-900">{call.businessName}</p>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">• {call.date}</span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium">{call.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
