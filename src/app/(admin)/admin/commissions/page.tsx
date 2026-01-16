"use client";

import { useState } from "react";

const COMMISSIONS = [
  { id: "1", repName: "Maria L.", type: "Close", customer: "Smile Dental", amount: "$50", earnedDate: "Jan 12, 2026", status: "Pending" },
  { id: "2", repName: "Maria L.", type: "Month 2 Retention", customer: "Joe's Pizza", amount: "$25", earnedDate: "Jan 10, 2026", status: "Paid" },
  { id: "3", repName: "John S.", type: "Close", customer: "Elite Body Shop", amount: "$50", earnedDate: "Jan 14, 2026", status: "Pending" },
  { id: "4", repName: "David R.", type: "Bonus", customer: "10 Closes Bonus", amount: "$100", earnedDate: "Jan 1, 2026", status: "Paid" },
];

export default function AdminCommissions() {
  const [activeTab, setActiveTab] = useState("Pending");

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Commissions & Payouts</h1>
          <p className="text-slate-500 font-medium mt-1">Track earnings and manage payments to your sales team.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/40 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Pending</p>
            <p className="text-xl font-black text-brand">$4,200</p>
          </div>
          <button className="h-14 px-8 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            Process Batch Payout
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center gap-8">
          {["Pending Payouts", "Payout History"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.split(' ')[0])}
              className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${
                activeTab === tab.split(' ')[0] ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
              {activeTab === tab.split(' ')[0] && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-brand rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4">Rep Name</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Customer / Item</th>
                <th className="px-4 py-4 text-right">Amount</th>
                <th className="px-4 py-4">Earned Date</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {COMMISSIONS.filter(c => activeTab === 'Pending' ? c.status !== 'Paid' : c.status === 'Paid').map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-slate-900">{comm.repName}</td>
                  <td className="px-4 py-5">
                    <span className="text-xs font-bold text-slate-600">{comm.type}</span>
                  </td>
                  <td className="px-4 py-5 font-medium text-slate-500">{comm.customer}</td>
                  <td className="px-4 py-5 text-right font-black text-slate-900">{comm.amount}</td>
                  <td className="px-4 py-5 text-slate-500 font-medium">{comm.earnedDate}</td>
                  <td className="px-4 py-5 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      comm.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {comm.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    {comm.status === 'Pending' ? (
                      <button className="text-brand text-xs font-black uppercase tracking-widest hover:underline">Mark as Paid</button>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold italic">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
