"use client";

import { useState } from "react";

const CUSTOMERS = [
  { id: "1", name: "Smile Dental", plan: "Pro", mrr: "$99", signedUp: "Jan 2, 2026", closedBy: "Maria L.", status: "Active", months: 1, lastLogin: "2 hours ago" },
  { id: "2", name: "Bright Teeth", plan: "Starter", mrr: "$49", signedUp: "Nov 15, 2025", closedBy: "David R.", status: "Churned", months: 2, lastLogin: "1 month ago" },
  { id: "3", name: "Joe's Pizza", plan: "Unlimited", mrr: "$199", signedUp: "Dec 10, 2025", closedBy: "Maria L.", status: "Active", months: 2, lastLogin: "Yesterday" },
  { id: "4", name: "Elite Body Shop", plan: "Pro", mrr: "$99", signedUp: "Jan 10, 2026", closedBy: "John S.", status: "Trial", months: 0, lastLogin: "3 hours ago" },
];

export default function AdminCustomers() {
  const [filter, setFilter] = useState("All");

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Customers</h1>
        <p className="text-slate-500 font-medium mt-1">View and manage all businesses using Reviews & Marketing.</p>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex gap-2">
            {["All", "Active", "Trial", "Churned"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  filter === f ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="h-10 pl-10 pr-4 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4">Business Name</th>
                <th className="px-4 py-4">Plan</th>
                <th className="px-4 py-4 text-center">MRR</th>
                <th className="px-4 py-4">Signed Up</th>
                <th className="px-4 py-4">Closed By</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Months Active</th>
                <th className="px-8 py-4 text-right">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {CUSTOMERS.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900 group-hover:text-brand transition-colors">{customer.name}</p>
                  </td>
                  <td className="px-4 py-5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                      customer.plan === 'Unlimited' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      customer.plan === 'Pro' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      {customer.plan}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center font-black text-slate-900">{customer.mrr}</td>
                  <td className="px-4 py-5 text-slate-500 font-medium">{customer.signedUp}</td>
                  <td className="px-4 py-5 font-bold text-slate-700">{customer.closedBy}</td>
                  <td className="px-4 py-5 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      customer.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                      customer.status === 'Trial' ? 'bg-blue-50 text-blue-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center font-bold text-slate-700">{customer.months}</td>
                  <td className="px-8 py-5 text-right text-slate-400 text-xs font-bold">{customer.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
