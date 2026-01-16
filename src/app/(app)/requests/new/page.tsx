"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewRequestPage() {
  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Send New Requests</h1>
        <p className="text-slate-500 font-medium mt-1">Send SMS or Email invitations to your customers.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="premium-card p-8 rounded-[40px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
          <h2 className="text-xl font-black text-slate-900 mb-6">Choose Channel</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-6 rounded-3xl border-2 border-brand bg-brand/5 text-center transition-all group">
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">📱</span>
              <p className="font-black text-slate-900 uppercase tracking-widest text-xs">SMS Blast</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">Highest open rate</p>
            </button>
            <button className="p-6 rounded-3xl border-2 border-slate-100 hover:border-brand/30 text-center transition-all group">
              <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">✉️</span>
              <p className="font-black text-slate-900 uppercase tracking-widest text-xs">Email Campaign</p>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">Best for newsletters</p>
            </button>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Contact List</label>
              <select className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-xs font-bold">
                <option>All Contacts (0)</option>
                <option>Recent Customers</option>
                <option>VIP List</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Select Template</label>
              <select className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-xs font-bold">
                <option>Default Invitation</option>
                <option>Review Request v1</option>
                <option>Feedback Only</option>
              </select>
            </div>
            <button className="primary-button w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20">
              Start Campaign
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6">Preview</h3>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative aspect-[9/16] max-w-[280px] mx-auto overflow-hidden">
               <div className="absolute top-8 left-4 right-4 bg-white/10 rounded-2xl p-4 text-[11px] leading-relaxed">
                  Hi! How was your visit to <strong>Smile Dental</strong> today? We'd love your feedback: https://r-m.link/s-dnt
               </div>
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
