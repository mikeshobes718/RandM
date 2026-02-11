"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { clientAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

function NewRequestContent() {
  const searchParams = useSearchParams();
  const [type, setType] = useState<"SMS" | "Email">("SMS");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("Your Business");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read from query params
    const tType = searchParams?.get('type');
    const tBody = searchParams?.get('body');
    const tName = searchParams?.get('name');

    if (tType === 'Email') setType('Email');
    if (tBody) setBody(tBody);
    if (tName) setName(tName);

    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (user) {
        try {
          const tok = await user.getIdToken();
          const res = await fetch('/api/dashboard/summary', {
            headers: { 'Authorization': `Bearer ${tok}` }
          });
          const data = await res.json();
          if (data.business?.name) setBusinessName(data.business.name);
          if (data.business?.id) setBusinessId(data.business.id);
        } catch (err) {
          console.error('Error fetching business name:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [searchParams]);

  const previewText = body
    .replace(/{{business_name}}/g, businessName)
    .replace(/{{link}}/g, businessId ? `reviewsandmarketing.com/r/${businessId}` : 'reviewsandmarketing.com/r/xyz');

  const handleStartCampaign = async () => {
    if (!name || !body || sending) return;

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const user = clientAuth.currentUser;
      if (!user) {
        setError('✕ You must be logged in to start a campaign.');
        setSending(false);
        return;
      }
      const tok = await user.getIdToken(true);
      const res = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}`
        },
        body: JSON.stringify({ name, type, body })
      });

      if (!res.ok) {
        const data = await res.json();
        // Check for session expiry specifically
        if (data.error?.toLowerCase().includes('expired')) {
          setError('✕ Your session has expired. Click here to refresh the page and try again.');
          return;
        }
        throw new Error(data.error || 'Failed to start campaign');
      }

      setSuccess('Campaign started successfully! You can track progress on the dashboard.');
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pt-6 pb-24 sm:pt-10 sm:pb-32 space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Send New Requests</h1>
        <p className="text-slate-500 text-sm font-medium">Send SMS or Email invitations to your customers.</p>
      </div>

      {(error || success) && (
        <div className="space-y-3">
          {error && (
            <div
              onClick={() => error.includes('refresh') && window.location.reload()}
              className={`p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold animate-in slide-in-from-top-2 ${error.includes('refresh') ? 'cursor-pointer hover:bg-red-100 transition-colors' : ''}`}
            >
              ✕ {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-sm font-bold animate-in slide-in-from-top-2">
              ✓ {success}
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="premium-card p-8 rounded-[40px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
          <h2 className="text-xl font-black text-slate-900 mb-6">Campaign Setup</h2>

          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Choose Channel</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setType('SMS')}
                  className={`p-6 rounded-3xl border-2 transition-all duration-300 group text-center relative overflow-hidden ${type === 'SMS'
                      ? 'border-brand bg-brand/5 shadow-xl shadow-brand/10 scale-[1.02]'
                      : 'border-slate-50 hover:border-slate-200 bg-slate-50/50 hover:scale-[1.01]'
                    }`}
                >
                  {type === 'SMS' && <div className="absolute top-0 right-0 p-2 text-brand text-xs">✓</div>}
                  <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform duration-300">📱</span>
                  <p className="font-black text-slate-900 uppercase tracking-widest text-xs">SMS Blast</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">Highest open rate</p>
                </button>
                <button
                  onClick={() => setType('Email')}
                  className={`p-6 rounded-3xl border-2 transition-all duration-300 group text-center relative overflow-hidden ${type === 'Email'
                      ? 'border-brand bg-brand/5 shadow-xl shadow-brand/10 scale-[1.02]'
                      : 'border-slate-50 hover:border-slate-200 bg-slate-50/50 hover:scale-[1.01]'
                    }`}
                >
                  {type === 'Email' && <div className="absolute top-0 right-0 p-2 text-brand text-xs">✓</div>}
                  <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform duration-300">✉️</span>
                  <p className="font-black text-slate-900 uppercase tracking-widest text-xs">Email Campaign</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">Best for newsletters</p>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Campaign Name</label>
              <input
                type="text"
                placeholder="e.g. Weekly Follow-up"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Contact List</label>
              <select className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-xs font-bold appearance-none cursor-pointer">
                <option>All Contacts</option>
                <option>Recent Customers (Last 7 Days)</option>
                <option>Square Customers</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Content</label>
                <div className="flex items-center gap-4">
                  {type === 'SMS' && (
                    <span className={`text-[9px] font-black uppercase tracking-widest ${body.length > 160 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {body.length} / 160 Characters
                    </span>
                  )}
                  <Link href="/templates" className="text-[9px] font-black text-brand uppercase tracking-widest hover:underline">Change Template →</Link>
                </div>
              </div>
              <textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold resize-none"
              />
            </div>

            <button
              className="primary-button w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-brand/20 disabled:opacity-50 disabled:grayscale"
              disabled={!body || !name || sending}
              onClick={handleStartCampaign}
            >
              {sending ? "Starting..." : "Start Campaign Now"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="text-6xl">{type === 'SMS' ? '📱' : '✉️'}</span>
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-10 text-white/40">Preview</h3>

            <div className="relative mx-auto max-w-[280px]">
              {type === 'SMS' ? (
                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 pt-12 aspect-[9/16] relative">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full"></div>
                  <div className="bg-[#242424] rounded-2xl p-4 text-[11px] leading-relaxed shadow-xl border border-white/5">
                    {previewText || "Your message will appear here..."}
                  </div>
                </div>
              ) : (
                <div className="bg-white text-slate-900 rounded-3xl p-6 min-h-[400px] shadow-2xl">
                  <div className="border-b border-slate-100 pb-4 mb-4">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Subject</p>
                    <p className="text-xs font-bold">{previewText.split('\n')[0].replace('Subject: ', '') || "No Subject"}</p>
                  </div>
                  <div className="text-[11px] leading-relaxed whitespace-pre-wrap">
                    {previewText.split('\n').slice(1).join('\n').trim() || "Your email body will appear here..."}
                  </div>
                </div>
              )}
              <div className="mt-8 text-center">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Campaign Preview Mode</p>
              </div>
            </div>
          </div>

          <div className="p-8 bg-brand/5 rounded-[40px] border border-brand/10">
            <h4 className="text-xs font-black uppercase tracking-widest text-brand mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse"></span>
              Compliance Check
            </h4>
            <p className="text-xs text-brand/70 leading-relaxed font-medium">
              {type === 'SMS'
                ? "Your message includes mandatory opt-out instructions. SMS campaigns are subject to 10DLC registration requirements."
                : "Your email includes a standard unsubscribe link in the footer to comply with CAN-SPAM regulations."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full mb-4"></div>
        <p className="text-muted text-sm font-medium uppercase tracking-widest">Loading campaign... </p>
      </div>
    }>
      <NewRequestContent />
    </Suspense>
  );
}
