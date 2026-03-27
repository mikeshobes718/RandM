"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const MOCK_CUSTOMER = {
  id: "1",
  name: "Smile Dental",
  plan: "Pro",
  mrr: "$99",
  signedUp: "Jan 2, 2026",
  closedBy: "Maria Lopez",
  status: "Active",
  monthsActive: 1,
  googleRating: 4.8,
  reviewCount: 142,
  email: "dr.smile@dentalgroup.com",
  phone: "(555) 123-4567",
  website: "https://smiledentalny.com",
  address: "123 Broadway, New York, NY 10001",
  notes: "High potential for Unlimited upgrade if they open the 2nd location next month.",
};

const MOCK_SCANS = [
  { date: "Today", scans: 14, leads: 3, conversions: "21%" },
  { date: "Yesterday", scans: 22, leads: 8, conversions: "36%" },
  { date: "Jan 13", scans: 18, leads: 5, conversions: "27%" },
];

export default function AdminCustomerDetail() {
  const params = useParams();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState("Activity");

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link 
            href="/admin/customers"
            className="w-12 h-12 rounded-2xl bg-surface border border-outline-variant/20 shadow-sm flex items-center justify-center text-on-surface-variant/60 hover:text-on-surface-variant transition-all hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-on-surface tracking-tight">{MOCK_CUSTOMER.name}</h1>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider">{MOCK_CUSTOMER.status}</span>
            </div>
            <p className="text-on-surface-variant font-medium mt-1">Customer ID: {id} • Active for {MOCK_CUSTOMER.monthsActive} months</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="h-14 px-8 bg-surface-container-low text-on-surface-variant font-black rounded-2xl hover:bg-outline-variant/30 transition-all">Cancel Plan</button>
          <button className="h-14 px-8 bg-brand text-white font-black rounded-2xl shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            Login as Dashboard
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {[
          { label: "Current Plan", value: MOCK_CUSTOMER.plan, color: "text-brand" },
          { label: "Monthly MRR", value: MOCK_CUSTOMER.mrr },
          { label: "Google Rating", value: MOCK_CUSTOMER.googleRating + " ★", color: "text-red-500" },
          { label: "Google Reviews", value: MOCK_CUSTOMER.reviewCount },
          { label: "Closed By", value: MOCK_CUSTOMER.closedBy, color: "text-on-surface" },
        ].map(stat => (
          <div key={stat.label} className="bg-surface p-6 rounded-3xl border border-outline-variant/20 shadow-lg shadow-outline-variant/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 mb-1">{stat.label}</p>
            <p className={`text-xl font-black ${stat.color || 'text-on-surface-variant'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Col: Customer Details */}
        <div className="space-y-8">
          <div className="bg-surface p-8 rounded-[40px] border border-outline-variant/20 shadow-xl shadow-outline-variant/20 space-y-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">Contact & Billing</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-1">Owner Email</label>
                <p className="text-sm font-bold text-on-surface-variant">{MOCK_CUSTOMER.email}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-1">Business Phone</label>
                <p className="text-sm font-bold text-on-surface-variant">{MOCK_CUSTOMER.phone}</p>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-1">Website</label>
                <a href={MOCK_CUSTOMER.website} target="_blank" className="text-sm font-bold text-brand hover:underline">{MOCK_CUSTOMER.website}</a>
              </div>
              <div className="pt-4 border-t border-outline-variant/20">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 block mb-1">Address</label>
                <p className="text-xs font-bold text-on-surface-variant leading-relaxed">{MOCK_CUSTOMER.address}</p>
              </div>
            </div>
          </div>

          <div className="bg-inverse-surface p-8 rounded-[40px] shadow-xl text-white">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6">Customer Notes</h3>
            <textarea 
              className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-brand/50 resize-none outline-none transition-all"
              defaultValue={MOCK_CUSTOMER.notes}
            ></textarea>
            <button className="w-full mt-4 py-4 rounded-xl bg-brand text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
              Save Notes
            </button>
          </div>
        </div>

        {/* Right Col: Activity Tabs */}
        <div className="lg:col-span-2 bg-surface rounded-[40px] border border-outline-variant/20 shadow-xl shadow-outline-variant/20 overflow-hidden">
          <div className="p-8 border-b border-outline-variant/20 flex items-center gap-8">
            {["Activity", "Billing History", "QR Stats", "Feedback"].map((tab) => (
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
            {activeTab === 'QR Stats' && (
              <table className="w-full text-left">
                <thead className="bg-surface-container-lowest/50 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                  <tr>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-4 py-4 text-center">Total Scans</th>
                    <th className="px-4 py-4 text-center">New Leads</th>
                    <th className="px-8 py-4 text-right">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {MOCK_SCANS.map((scan, i) => (
                    <tr key={i} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-on-surface">{scan.date}</td>
                      <td className="px-4 py-5 text-center font-bold text-on-surface-variant">{scan.scans}</td>
                      <td className="px-4 py-5 text-center text-on-surface font-black">{scan.leads}</td>
                      <td className="px-8 py-5 text-right font-black text-emerald-500">{scan.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'Activity' && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-3xl bg-surface-container-lowest flex items-center justify-center text-on-surface-variant/50 mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-on-surface">Customer Activity Feed</h3>
                <p className="text-sm text-on-surface-variant/60 font-medium max-w-xs mx-auto mt-2">Historical log of QR scans, review requests, and logins will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
