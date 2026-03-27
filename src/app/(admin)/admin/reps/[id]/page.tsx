"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminRepDetail() {
  const params = useParams() as any;
  const id = params?.id;
  const [rep, setRep] = useState<any>(null);
  const [closes, setCloses] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Closes");

  useEffect(() => {
    async function fetchRepData() {
      if (!id) return;
      try {
        const [repRes, callsRes] = await Promise.all([
          fetch(`/api/admin/reps/${id}`),
          fetch(`/api/admin/reps/${id}/calls`)
        ]);
        const repData = await repRes.json();
        const callsData = await callsRes.json();
        
        setRep(repData.rep);
        setCloses(repData.closes || []);
        setCalls(callsData.calls || []);
      } catch (err) {
        console.error('Failed to fetch rep data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRepData();
  }, [id]);

  if (loading) return <div className="p-12 text-center font-black animate-pulse text-white">LOADING REP DETAILS...</div>;
  if (!rep) return <div className="p-12 text-center font-black text-white">REP NOT FOUND</div>;

  const totalCalls = calls.length;
  const totalCloses = closes.length;
  const closeRate = totalCalls > 0 ? ((totalCloses / totalCalls) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link 
            href="/admin/reps"
            className="w-12 h-12 rounded-2xl bg-surface border border-outline-variant/20 shadow-sm flex items-center justify-center text-on-surface-variant/60 hover:text-on-surface-variant transition-all hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-on-surface tracking-tight">{rep.name}</h1>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                rep.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-container-low text-on-surface-variant'
              }`}>{rep.status}</span>
            </div>
            <p className="text-on-surface-variant font-medium mt-1">Rep ID: {id} • Joined {new Date(rep.start_date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="h-14 px-8 bg-surface-container-low text-on-surface-variant font-black rounded-2xl hover:bg-outline-variant/30 transition-all">Mark Inactive</button>
          <button className="h-14 px-8 bg-red-50 text-red-600 border border-red-100 font-black rounded-2xl hover:bg-red-100 transition-all">Drop Rep</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {[
          { label: "Leads Assigned", value: rep.leads_assigned || 0 },
          { label: "Total Calls", value: totalCalls },
          { label: "Total Closes", value: totalCloses },
          { label: "Close Rate", value: closeRate + "%" },
          { label: "Total Earned", value: `$${(rep.total_earned || 0).toLocaleString()}`, color: "text-on-surface" },
          { label: "Pending Payout", value: `$${(rep.pending_payout || 0).toLocaleString()}`, color: "text-brand" },
        ].map(stat => (
          <div key={stat.label} className="bg-surface p-6 rounded-3xl border border-outline-variant/20 shadow-lg shadow-outline-variant/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 mb-1">{stat.label}</p>
            <p className={`text-xl font-black ${stat.color || 'text-on-surface-variant'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Col: Details & Notes */}
        <div className="space-y-8">
          <div className="bg-surface p-8 rounded-[40px] border border-outline-variant/20 shadow-xl shadow-outline-variant/20 space-y-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">Contact & Payout</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-1">Email</label>
                <p className="text-sm font-bold text-on-surface-variant">{rep.email}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-1">WhatsApp</label>
                <p className="text-sm font-bold text-on-surface-variant">{rep.whatsapp || 'Not provided'}</p>
              </div>
              <div className="pt-4 border-t border-outline-variant/20">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-1">Payment Method</label>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md bg-surface-container-low text-[10px] font-black uppercase text-on-surface-variant">{rep.payment_method || 'None'}</span>
                  <p className="text-sm font-bold text-on-surface">{rep.payment_id || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface p-8 rounded-[40px] border border-outline-variant/20 shadow-xl shadow-outline-variant/20 space-y-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">Tracking & Links</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-1">Unique Referral Link</label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={`https://reviewsandmarketing.com/register?ref=${rep.tracking_code}`}
                    className="flex-1 bg-surface-container-lowest border-none rounded-xl px-4 py-3 text-xs font-mono font-bold text-on-surface-variant"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-inverse-surface p-8 rounded-[40px] shadow-xl text-white">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6">Internal Admin Notes</h3>
            <textarea 
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand/50 resize-none outline-none transition-all"
              defaultValue={rep.notes}
            ></textarea>
            <button className="w-full mt-4 py-4 rounded-xl bg-brand text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
              Save Notes
            </button>
          </div>
        </div>

        {/* Right Col: Activity Tabs */}
        <div className="lg:col-span-2 bg-surface rounded-[40px] border border-outline-variant/20 shadow-xl shadow-outline-variant/20 overflow-hidden">
          <div className="p-8 border-b border-outline-variant/20 flex items-center gap-8">
            {["Closes", "Call Log", "Commission History"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeTab === tab ? "text-on-surface" : "text-on-surface-variant/60 hover:text-on-surface-variant"
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
                <thead className="bg-surface-container-lowest/50 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                  <tr>
                    <th className="px-8 py-4">Customer</th>
                    <th className="px-4 py-4">Plan</th>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-8 py-4 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {closes.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-8 text-center text-on-surface-variant/60 italic">No closes yet.</td></tr>
                  ) : closes.map(close => (
                    <tr key={close.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-on-surface">{close.business_name}</td>
                      <td className="px-4 py-5 font-bold text-on-surface-variant text-xs">{close.plan}</td>
                      <td className="px-4 py-5 text-on-surface-variant text-sm font-medium">{new Date(close.signed_up_date).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-right font-black text-emerald-500">${close.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'Call Log' && (
              <div className="p-8 space-y-6">
                {calls.length === 0 ? (
                  <p className="text-center text-on-surface-variant/60 italic">No calls logged yet.</p>
                ) : calls.map(call => (
                  <div key={call.id} className="flex gap-4 p-4 rounded-3xl border border-outline-variant/20 hover:bg-surface-container-lowest transition-all">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant/60 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-on-surface">{call.lead_name}</p>
                        <span className="text-[10px] font-black uppercase text-on-surface-variant/60 tracking-widest">• {new Date(call.timestamp).toLocaleString()}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          call.outcome === 'closed' ? 'bg-emerald-100 text-emerald-600' : 'bg-surface-container-low text-on-surface-variant'
                        }`}>{call.outcome}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant font-medium">{call.notes}</p>
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
