"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DEFAULT_TEMPLATES = [
  {
    id: 'sms-1',
    type: 'SMS',
    name: 'Standard Request',
    description: 'Perfect for regular check-ins. Balanced and polite.',
    body: "Hi! This is {{business_name}}. We'd love to hear about your recent visit. Could you leave us a quick review here? {{link}} Reply STOP to opt-out.",
    compliance: 'Includes STOP handling',
    recommended: true
  },
  {
    id: 'sms-2',
    type: 'SMS',
    name: 'Short & Sweet',
    description: 'Highest conversion rate. Quick and direct.',
    body: "Thanks for choosing {{business_name}}! How did we do? {{link}} STOP to end.",
    compliance: 'Includes STOP handling',
    badge: 'High Conversion'
  },
  {
    id: 'email-1',
    type: 'Email',
    name: 'Professional Follow-up',
    description: 'Best for high-ticket services. Detailed and formal.',
    body: "Subject: How was your experience at {{business_name}}?\n\nHi there,\n\nThank you for visiting us recently! We strive to provide the best service possible and would greatly appreciate your feedback.\n\nCould you take 30 seconds to share your experience?\n\n{{link}}\n\nThank you,\nThe team at {{business_name}}",
    compliance: 'Standard unsubscribe included'
  },
  {
    id: 'sms-3',
    type: 'SMS',
    name: 'Personal Touch',
    description: 'Feels like it came from a real person.',
    body: "Hi! This is {{business_name}}. Just wanted to reach out personally and thank you for your support. If you have a second, a quick review would mean the world to us: {{link}} STOP to end.",
    compliance: 'Includes STOP handling'
  }
];

export default function TemplatesPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("Your Business");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<"All" | "SMS" | "Email">("All");
  const [customName, setCustomName] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [customType, setCustomType] = useState<"SMS" | "Email">("SMS");
  
  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(res => res.json())
      .then(data => {
        if (data.business?.name) setBusinessName(data.business.name);
        if (data.business?.id) setBusinessId(data.business.id);
      });
  }, []);

  const previewTemplate = (body: string) => {
    const link = businessId ? `reviewsandmarketing.com/r/${businessId}` : 'reviewsandmarketing.com/r/xyz';
    return body
      .replace(/{{business_name}}/g, businessName)
      .replace(/{{link}}/g, link);
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

  const filteredTemplates = DEFAULT_TEMPLATES.filter(t => filter === 'All' || t.type === filter);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Message Templates</h1>
          <p className="text-slate-500 font-medium mt-2">Choose a high-converting template or create your own.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="h-12 px-6 border-2 border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center">
            Back to Dashboard
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-12 px-8 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-slate-200"
          >
            ➕ New Template
          </button>
        </div>
      </div>

      {/* Filter Tabs & Helper */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        <div className="flex-1">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
            {(['All', 'SMS', 'Email'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === tab 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-brand/5 border border-brand/10 rounded-2xl px-6 py-4 flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">Smart Variables</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <code className="text-[10px] bg-white border border-brand/20 px-2 py-1 rounded-lg text-brand font-bold">{"{{business_name}}"}</code>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Business Name</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-[10px] bg-white border border-brand/20 px-2 py-1 rounded-lg text-brand font-bold">{"{{link}}"}</code>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Review Link</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredTemplates.map((t: any) => (
          <div key={t.id} className="group premium-card p-8 rounded-[48px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col hover:border-brand/20 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    t.type === 'SMS' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                  }`}>
                    {t.type}
                  </span>
                  {t.recommended && (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Recommended
                    </span>
                  )}
                  {t.badge && (
                    <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      {t.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{t.name}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">{t.description}</p>
              </div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{t.compliance}</span>
            </div>

            <div className="flex-1">
              <div className="mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
                  <span>Template Source</span>
                  {t.type === 'SMS' && <span className="text-slate-300">{t.body.length} chars</span>}
                </p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-mono text-[11px] text-slate-500 whitespace-pre-wrap leading-relaxed">
                  {t.body}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-3">Live Preview</p>
                {t.type === 'SMS' ? (
                  <div className="relative mx-auto max-w-[280px]">
                    <div className="bg-slate-100 p-4 rounded-[32px] border-4 border-slate-200 shadow-inner">
                      <div className="bg-brand text-white p-3 rounded-2xl rounded-bl-none text-xs font-medium leading-relaxed shadow-sm">
                        {previewTemplate(t.body)}
                      </div>
                      <p className="text-[8px] text-slate-400 text-center mt-3 font-bold uppercase tracking-tighter">Text Message • Today</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-white border-2 border-brand/10 rounded-3xl text-sm text-slate-900 shadow-inner min-h-[150px]">
                    {previewTemplate(t.body).split('\n').map((line, i) => (
                      <p key={i} className={`${i === 0 ? 'font-black text-base mb-4' : 'leading-relaxed text-slate-600 text-xs'}`}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => handleUseTemplate(t)}
              className="mt-10 primary-button w-full h-14 rounded-2xl shadow-xl shadow-brand/20 group-hover:scale-[1.02] transition-all"
            >
              Use This Template
            </button>
          </div>
        ))}

        <div 
          onClick={() => setIsModalOpen(true)}
          className="group p-8 rounded-[48px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center hover:border-brand/30 hover:bg-brand/5 transition-all cursor-pointer min-h-[400px]"
        >
          <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
            <span className="text-4xl">➕</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Custom Template</h3>
          <p className="text-xs text-slate-400 font-medium max-w-[220px] leading-relaxed">Design your own message with smart variables and custom formatting.</p>
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
