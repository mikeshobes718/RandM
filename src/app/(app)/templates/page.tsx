"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DEFAULT_TEMPLATES = [
  {
    id: 'sms-1',
    type: 'SMS',
    name: 'Standard Request',
    body: "Hi! This is {{business_name}}. We'd love to hear about your recent visit. Could you leave us a quick review here? {{link}} Reply STOP to opt-out.",
    compliance: 'Includes STOP handling'
  },
  {
    id: 'sms-2',
    type: 'SMS',
    name: 'Short & Sweet',
    body: "Thanks for choosing {{business_name}}! How did we do? {{link}} STOP to end.",
    compliance: 'Includes STOP handling'
  },
  {
    id: 'email-1',
    type: 'Email',
    name: 'Professional Follow-up',
    body: "Subject: How was your experience at {{business_name}}?\n\nHi there,\n\nThank you for visiting us recently! We strive to provide the best service possible and would greatly appreciate your feedback.\n\nCould you take 30 seconds to share your experience?\n\n{{link}}\n\nThank you,\nThe team at {{business_name}}",
    compliance: 'Standard unsubscribe included'
  }
];

export default function TemplatesPage() {
  const [businessName, setBusinessName] = useState("Your Business");
  
  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(res => res.json())
      .then(data => {
        if (data.business?.name) setBusinessName(data.business.name);
      });
  }, []);

  const previewTemplate = (body: string) => {
    return body
      .replace(/{{business_name}}/g, businessName)
      .replace(/{{link}}/g, 'reviewsandmarketing.com/r/xyz');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Message Templates</h1>
          <p className="text-muted text-sm font-medium mt-1">Ready-to-use SMS and Email invitations.</p>
        </div>
        <Link href="/dashboard" className="secondary-button !h-10 px-6">
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {DEFAULT_TEMPLATES.map((t) => (
          <div key={t.id} className="premium-card p-8 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  t.type === 'SMS' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                }`}>
                  {t.type}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{t.name}</h3>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.compliance}</span>
            </div>

            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Template Content</p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs text-slate-600 mb-6">
                {t.body}
              </div>

              <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-3">Live Preview</p>
              <div className="p-4 bg-white border-2 border-brand/10 rounded-2xl text-sm text-slate-900 shadow-inner">
                {previewTemplate(t.body).split('\n').map((line, i) => (
                  <p key={i} className={i === 0 && t.type === 'Email' ? 'font-bold mb-2' : ''}>{line}</p>
                ))}
              </div>
            </div>

            <button className="mt-8 primary-button w-full h-12 rounded-2xl shadow-lg shadow-brand/20">
              Use Template
            </button>
          </div>
        ))}

        <div className="premium-card p-8 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group hover:border-brand/30 transition-all cursor-pointer">
          <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-3xl">➕</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Create Custom Template</h3>
          <p className="text-xs text-slate-400 font-medium max-w-[200px]">Design your own message with custom variables.</p>
        </div>
      </div>
    </div>
  );
}
