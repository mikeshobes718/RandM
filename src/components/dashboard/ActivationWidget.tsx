"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { MiniHowItWorks } from '@/components/MiniHowItWorks';
import { QrCode, Smartphone, GitFork, TrendingUp, CheckCircle, Store, MessageSquare, Star } from 'lucide-react';

interface ActivationWidgetProps {
  business: {
    id: string | null;
    google_place_id?: string | null;
  };
  stats: {
    reviewsThisMonth: number;
    shareLinkScans: number;
  };
  recentFeedbackCount: number;
  isPro: boolean;
  onStatusChange?: (isActivated: boolean) => void;
}

export default function ActivationWidget({ business, stats, recentFeedbackCount, isPro, onStatusChange }: ActivationWidgetProps) {
  const [checklist, setChecklist] = useState({
    googleConnected: !!business.google_place_id,
    qrCreated: !!business.id,
    qrDownloaded: false,
    qrPlaced: false,
    firstUsage: false,
    feedbackCaptured: recentFeedbackCount > 0,
    scriptInstalled: false,
  });


  useEffect(() => {
    // Load local-only state from localStorage
    if (business.id) {
      const saved = localStorage.getItem(`activation_${business.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setChecklist(prev => ({
            ...prev,
            qrDownloaded: parsed.qrDownloaded || false,
            qrPlaced: parsed.qrPlaced || false,
            scriptInstalled: parsed.scriptInstalled || false,
          }));
        } catch { }
      }
    }
  }, [business.id]);

  useEffect(() => {
    // Update derived states
    const firstUsage = stats.shareLinkScans >= 3 || stats.reviewsThisMonth >= 1;
    setChecklist(prev => ({
      ...prev,
      googleConnected: !!business.google_place_id,
      qrCreated: !!business.id,
      firstUsage,
      feedbackCaptured: recentFeedbackCount > 0,
    }));
  }, [business, stats, recentFeedbackCount]);

  const toggleStep = (key: keyof typeof checklist) => {
    if (key === 'googleConnected' || key === 'qrCreated' || key === 'firstUsage' || key === 'feedbackCaptured') return;

    const newChecklist = { ...checklist, [key]: !checklist[key] };
    setChecklist(newChecklist);

    if (business.id) {
      localStorage.setItem(`activation_${business.id}`, JSON.stringify(newChecklist));
    }
  };

  const steps = [
    { key: 'googleConnected', label: 'Google link connected', done: checklist.googleConnected, required: true },
    { key: 'qrCreated', label: 'QR code created', done: checklist.qrCreated, required: true },
    { key: 'qrDownloaded', label: 'Download/print QR', done: checklist.qrDownloaded, required: true, action: 'Download' },
    { key: 'qrPlaced', label: 'Confirm QR placed', done: checklist.qrPlaced, required: true, toggleable: true },
    { key: 'firstUsage', label: 'First real usage (3+ scans)', done: checklist.firstUsage, required: true },
    { key: 'feedbackCaptured', label: 'First private feedback captured', done: checklist.feedbackCaptured, required: false },
    { key: 'scriptInstalled', label: 'Staff script installed', done: checklist.scriptInstalled, required: false, toggleable: true },
  ];

  const completedSteps = steps.filter(s => s.done).length;
  const totalRequired = steps.filter(s => s.required).length;
  const progress = Math.round((steps.filter(s => s.done && s.required).length / totalRequired) * 100);
  const isActivated = checklist.googleConnected && checklist.qrCreated && checklist.qrDownloaded && checklist.qrPlaced && checklist.firstUsage;

  useEffect(() => {
    onStatusChange?.(isActivated);
  }, [isActivated, onStatusChange]);


  return (
    <div className="premium-card p-6 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            Setup Progress
            {isActivated && <span className="text-emerald-500">✅</span>}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isActivated ? 'Business Activated' : 'Complete setup to go live'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-brand">{progress}%</span>
        </div>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
        <div
          className="bg-brand h-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        {steps.map((step) => (
          <div key={step.key} className="flex items-start gap-3 group">
            <button
              onClick={() => step.toggleable && toggleStep(step.key as any)}
              disabled={!step.toggleable}
              className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${step.done
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-200 group-hover:border-brand/30'
                } ${!step.toggleable && !step.done ? 'opacity-50' : ''}`}
            >
              {step.done && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${step.done ? 'text-slate-400 line-through' : 'text-slate-700'} truncate`}>
                {step.label}
              </p>
              {step.key === 'qrDownloaded' && (
                <button
                  onClick={() => {
                    toggleStep('qrDownloaded');
                  }}
                  className="text-[9px] font-black text-brand uppercase tracking-widest mt-1 hover:underline"
                >
                  Get Print Assets →
                </button>
              )}
              {step.key === 'scriptInstalled' && (
                <Link href="/One_Page_Overview.pdf" target="_blank" className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 hover:text-brand transition-colors block">
                  Download 1-Pager →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isActivated && (
        <div className="mt-8 p-4 bg-brand/5 rounded-2xl border border-brand/10">
          <p className="text-[10px] text-brand font-bold leading-relaxed">
            🚀 <strong>Next Step:</strong> {steps.find(s => !s.done)?.label}
          </p>
        </div>
      )}

      <MiniHowItWorks 
        className="mt-8 bg-white border-slate-100 shadow-sm"
        title="Activation Guide"
        steps={[
          { icon: Store, title: "1. Connect", desc: "Link your Google Business Profile to sync your review link." },
          { icon: QrCode, title: "2. Generate QR", desc: "Download and print your custom review QR code." },
          { icon: Smartphone, title: "3. First Scans", desc: "Place the QR code where customers can scan it." },
          { icon: Star, title: "4. Go Live", desc: "Start collecting reviews and private feedback automatically." }
        ]}
      />
    </div>
  );
}
