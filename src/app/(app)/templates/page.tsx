"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [businessName, setBusinessName] = useState("Your Business");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [customType, setCustomType] = useState<"SMS" | "Email">("SMS");
  
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

  const handleUseTemplate = (template: any) => {
    const params = new URLSearchParams({
      type: template.type,
      templateId: template.id,
      body: template.body,
      name: template.name
    });
    router.push(`/requests/new?${params.toString()}`);
  };

  const handleCreateCustom = () => {
    // For now, just navigate to new request with this content
    const params = new URLSearchParams({
      type: customType,
      body: customBody,
      name: customName || 'Custom Template'
    });
    router.push(`/requests/new?${params.toString()}`);
    setIsModalOpen(false);
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
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-xs text-slate-600 mb-6 whitespace-pre-wrap">
                {t.body}
              </div>

              <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-3">Live Preview</p>
              <div className="p-4 bg-white border-2 border-brand/10 rounded-2xl text-sm text-slate-900 shadow-inner">
                {previewTemplate(t.body).split('\n').map((line, i) => (
                  <p key={i} className={i === 0 && t.type === 'Email' ? 'font-bold mb-2' : ''}>{line}</p>
                ))}
              </div>
            </div>

            <button 
              onClick={() => handleUseTemplate(t)}
              className="mt-8 primary-button w-full h-12 rounded-2xl shadow-lg shadow-brand/20"
            >
              Use Template
            </button>
          </div>
        ))}

        <div 
          onClick={() => setIsModalOpen(true)}
          className="premium-card p-8 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center group hover:border-brand/30 transition-all cursor-pointer min-h-[400px]"
        >
          <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <span className="text-3xl">➕</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Create Custom Template</h3>
          <p className="text-xs text-slate-400 font-medium max-w-[200px]">Design your own message with custom variables.</p>
        </div>
      </div>

      {/* Custom Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Create Custom Template</h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Template Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setCustomType('SMS')}
                    className={`h-12 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      customType === 'SMS' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    SMS
                  </button>
                  <button 
                    onClick={() => setCustomType('Email')}
                    className={`h-12 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      customType === 'Email' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Template Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Weekend Special"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-xs font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Content</label>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Use {"{{business_name}}"} and {"{{link}}"}</span>
                </div>
                <textarea 
                  rows={5}
                  placeholder="Write your message here..."
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold resize-none"
                />
              </div>

              <button 
                onClick={handleCreateCustom}
                disabled={!customBody}
                className="primary-button w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20 disabled:opacity-50 disabled:grayscale"
              >
                Create & Use
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
