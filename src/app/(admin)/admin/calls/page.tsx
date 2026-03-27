"use client";

import { useEffect, useState } from "react";

export default function CallLog() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRep, setFilterRep] = useState("all");
  const [filterOutcome, setFilterOutcome] = useState("all");

  useEffect(() => {
    async function fetchCalls() {
      try {
        const res = await fetch('/api/admin/calls');
        const data = await res.json();
        setCalls(data.calls || []);
      } catch (err) {
        console.error('Failed to fetch calls:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCalls();
  }, []);

  const filteredCalls = calls.filter(call => {
    if (filterRep !== "all" && call.rep_name !== filterRep) return false;
    if (filterOutcome !== "all" && call.outcome !== filterOutcome) return false;
    return true;
  });

  const uniqueReps = Array.from(new Set(calls.map(c => c.rep_name))).sort();

  if (loading) return <div className="p-12 text-center font-black animate-pulse text-white">LOADING CALL LOG...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-on-surface tracking-tight">Call Log</h1>
          <p className="text-on-surface-variant font-medium mt-1">Real-time record of all rep activity across the system.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-surface p-6 rounded-[32px] border border-outline-variant/20 shadow-xl shadow-outline-variant/20">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase text-on-surface-variant/60 tracking-widest">Filter by Rep:</span>
          <select 
            value={filterRep}
            onChange={(e) => setFilterRep(e.target.value)}
            className="h-10 px-4 rounded-xl border border-outline-variant/30 text-sm font-bold focus:outline-none bg-surface-container-lowest"
          >
            <option value="all">All Reps</option>
            {uniqueReps.map(rep => <option key={rep} value={rep}>{rep}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase text-on-surface-variant/60 tracking-widest">Outcome:</span>
          <select 
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="h-10 px-4 rounded-xl border border-outline-variant/30 text-sm font-bold focus:outline-none bg-surface-container-lowest"
          >
            <option value="all">Any Outcome</option>
            <option value="no answer">No Answer</option>
            <option value="left vm">Left VM</option>
            <option value="spoke to dm">Spoke to DM</option>
            <option value="callback">Callback</option>
            <option value="not interested">Not Interested</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-[40px] border border-outline-variant/20 shadow-2xl shadow-outline-variant/20 overflow-hidden">
        <div className="overflow-x-auto max-h-[800px] overflow-y-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-surface shadow-sm">
              <tr className="bg-surface-container-lowest/50 border-b border-outline-variant/20">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Rep</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Business Name</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Phone</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Attempts</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Outcome</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Notes</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-12 text-center text-on-surface-variant/60 font-medium italic">No calls logged yet.</td>
                </tr>
              ) : (
                filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-surface-container-lowest/50 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <p className="text-sm font-bold text-on-surface">{new Date(call.timestamp).toLocaleDateString()}</p>
                      <p className="text-[10px] font-medium text-on-surface-variant/60">{new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <p className="text-sm font-black text-on-surface">{call.rep_name}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-on-surface">{call.lead_name}</p>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <p className="text-sm font-medium text-on-surface-variant">{call.lead_phone}</p>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-center">
                      <span className="text-sm font-black text-brand">{call.times_called || '1'}</span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
                        call.outcome === 'closed' ? 'bg-emerald-100 text-emerald-600' :
                        call.outcome === 'callback' ? 'bg-amber-100 text-amber-600' :
                        call.outcome === 'no answer' ? 'bg-red-50 text-red-500' :
                        'bg-surface-container-low text-on-surface-variant'
                      }`}>
                        {call.outcome}
                      </span>
                    </td>
                    <td className="px-8 py-5 max-w-xs">
                      <p className="text-sm text-on-surface-variant truncate" title={call.notes}>{call.notes || '-'}</p>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      {call.followup_date ? (
                        <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                          {new Date(call.followup_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/50">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
