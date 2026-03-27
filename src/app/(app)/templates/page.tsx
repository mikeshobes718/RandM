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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">Message Templates</h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm">Choose a high-converting template or create your own.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="h-10 px-5 border border-outline-variant/20 text-on-surface-variant text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-surface-container-lowest transition-all flex items-center">
            Dashboard
          </Link>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-6 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span> New Template
          </button>
        </div>
      </div>

      {/* Filter Tabs & Helper */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <div className="flex-1">
          <div className="flex p-1 bg-surface-container-low rounded-xl w-fit">
            {(['All', 'SMS', 'Email'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  filter === tab 
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm' 
                    : 'text-on-surface-variant/60 hover:text-on-surface-variant'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-primary-fixed/30 border border-primary/10 rounded-xl px-5 py-3 flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Variables</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <code className="text-[10px] bg-surface-container-lowest border border-primary/15 px-2 py-0.5 rounded text-primary font-semibold">{"{{business_name}}"}</code>
            </div>
            <div className="flex items-center gap-1.5">
              <code className="text-[10px] bg-surface-container-lowest border border-primary/15 px-2 py-0.5 rounded text-primary font-semibold">{"{{link}}"}</code>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.map((t: any) => (
          <div key={t.id} className="group bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/15 shadow-sm flex flex-col hover:border-primary/20 transition-all">
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
                <h3 className="text-xl font-black text-on-surface tracking-tight">{t.name}</h3>
                <p className="text-xs text-on-surface-variant/60 font-medium mt-1">{t.description}</p>
              </div>
              <span className="text-[9px] font-black text-on-surface-variant/50 uppercase tracking-widest mt-1">{t.compliance}</span>
            </div>

            <div className="flex-1">
              <div className="mb-6">
                <p className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest mb-3 flex justify-between">
                  <span>Template Source</span>
                  {t.type === 'SMS' && <span className="text-on-surface-variant/50">{t.body.length} chars</span>}
                </p>
                <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 font-mono text-[11px] text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                  {t.body}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-3">Live Preview</p>
                {t.type === 'SMS' ? (
                  <div className="relative mx-auto max-w-[280px]">
                    <div className="bg-surface-container-low p-4 rounded-[32px] border-4 border-outline-variant/30 shadow-inner">
                      <div className="bg-brand text-white p-3 rounded-2xl rounded-bl-none text-xs font-medium leading-relaxed shadow-sm">
                        {previewTemplate(t.body)}
                      </div>
                      <p className="text-[8px] text-on-surface-variant/60 text-center mt-3 font-bold uppercase tracking-tighter">Text Message • Today</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-surface border-2 border-brand/10 rounded-3xl text-sm text-on-surface shadow-inner min-h-[150px]">
                    {previewTemplate(t.body).split('\n').map((line, i) => (
                      <p key={i} className={`${i === 0 ? 'font-black text-base mb-4' : 'leading-relaxed text-on-surface-variant text-xs'}`}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => handleUseTemplate(t)}
              className="mt-8 h-12 w-full bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
            >
              Use This Template
            </button>
          </div>
        ))}

        <div 
          onClick={() => setIsModalOpen(true)}
          className="group p-6 rounded-xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-center hover:border-primary/30 hover:bg-primary-fixed/10 transition-all cursor-pointer min-h-[400px]"
        >
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-4 group-hover:text-primary transition-colors">add_circle</span>
          <h3 className="text-lg font-bold text-on-surface mb-1">Custom Template</h3>
          <p className="text-xs text-on-surface-variant max-w-[220px] leading-relaxed">Design your own message with smart variables.</p>
        </div>
      </div>

      {/* Custom Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl p-8 max-w-lg w-full shadow-2xl relative border border-outline-variant/15">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-on-surface-variant/60 hover:text-on-surface transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-black text-on-surface mb-8 tracking-tight">Create Custom Template</h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest block mb-2">Template Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setCustomType('SMS')}
                    className={`h-12 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      customType === 'SMS' ? 'bg-inverse-surface text-white shadow-lg' : 'bg-surface-container-lowest text-on-surface-variant/60 hover:bg-surface-container-low'
                    }`}
                  >
                    SMS
                  </button>
                  <button 
                    onClick={() => setCustomType('Email')}
                    className={`h-12 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      customType === 'Email' ? 'bg-inverse-surface text-white shadow-lg' : 'bg-surface-container-lowest text-on-surface-variant/60 hover:bg-surface-container-low'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest block mb-2">Template Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Weekend Special"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full h-12 bg-surface-container-lowest border-none rounded-2xl px-4 text-xs font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Message Content</label>
                  <span className="text-[9px] text-on-surface-variant/60 font-bold uppercase tracking-tighter">Use {"{{business_name}}"} and {"{{link}}"}</span>
                </div>
                <textarea 
                  rows={5}
                  placeholder="Write your message here..."
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none rounded-2xl p-4 text-xs font-bold resize-none"
                />
              </div>

              <button 
                onClick={handleCreateCustom}
                disabled={!customBody}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 disabled:grayscale"
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
