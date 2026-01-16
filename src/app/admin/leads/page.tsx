"use client";

import { useState } from "react";
import Link from "next/link";

const LEADS = [
  { id: "1", name: "Joe's Pizza", phone: "(555) 123-4567", location: "New York, NY", category: "Restaurant", rating: 3.8, reviews: 142, assignedTo: "Maria L.", status: "Called", lastContact: "2 hours ago" },
  { id: "2", name: "Smile Dental", phone: "(555) 987-6543", location: "Los Angeles, CA", category: "Dentist", rating: 4.1, reviews: 85, assignedTo: "Unassigned", status: "Fresh", lastContact: "-" },
  { id: "3", name: "Elite Body Shop", phone: "(555) 444-2222", location: "Miami, FL", category: "Auto Repair", rating: 3.2, reviews: 210, assignedTo: "John S.", status: "Follow-up", lastContact: "Yesterday" },
  { id: "4", name: "Boutique Gym", phone: "(555) 333-1111", location: "Austin, TX", category: "Gym", rating: 4.2, reviews: 64, assignedTo: "Unassigned", status: "Fresh", lastContact: "-" },
];

export default function AdminLeads() {
  const [statusFilter, setStatusFilter] = useState("All");

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Lead Pool</h1>
          <p className="text-slate-500 font-medium mt-1">Monitor all potential leads and their assignment status.</p>
        </div>
        <Link 
          href="/admin/leads/upload" 
          className="h-14 px-8 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
          </svg>
          Upload CSV
        </Link>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {["All", "Fresh", "Called", "Follow-up", "Closed", "Dead"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  statusFilter === f ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <select className="h-10 px-4 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all cursor-pointer">
              <option value="">Category: All</option>
              <option value="Dentist">Dentist</option>
              <option value="Restaurant">Restaurant</option>
            </select>
            <div className="relative">
              <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search leads..." 
                className="h-10 pl-10 pr-4 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 w-64 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4">Business Name</th>
                <th className="px-4 py-4">Location</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4 text-center">Rating</th>
                <th className="px-4 py-4 text-center">Reviews</th>
                <th className="px-4 py-4">Assigned To</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Last Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {LEADS.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900">{lead.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{lead.phone}</p>
                  </td>
                  <td className="px-4 py-5 text-slate-500 font-medium">{lead.location}</td>
                  <td className="px-4 py-5 text-slate-500 font-medium">{lead.category}</td>
                  <td className="px-4 py-5 text-center">
                    <span className="font-black text-red-500">{lead.rating} ★</span>
                  </td>
                  <td className="px-4 py-5 text-center font-bold text-slate-700">{lead.reviews}</td>
                  <td className="px-4 py-5">
                    {lead.assignedTo === 'Unassigned' ? (
                      <button className="text-brand text-xs font-black uppercase tracking-widest hover:underline">Assign</button>
                    ) : (
                      <span className="text-slate-900 font-bold">{lead.assignedTo}</span>
                    )}
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      lead.status === 'Fresh' ? 'bg-blue-50 text-blue-600' :
                      lead.status === 'Closed' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right text-slate-400 text-xs font-bold">{lead.lastContact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
