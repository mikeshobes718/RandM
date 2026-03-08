"use client";

import { useEffect, useState } from "react";
import {
  QrCode,
  Star,
  GitFork,
  TrendingUp,
  CheckCircle2,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function AnimatedFlow() {
  const [step, setStep] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    setStep(0);
    const timers = [
      setTimeout(() => setStep(1), 2000),
      setTimeout(() => setStep(2), 4500),
      setTimeout(() => setStep(3), 7500),
      setTimeout(() => setStep(4), 10500),
      setTimeout(() => setStep(5), 13000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [playCount]);

  const stages = [
    {
      id: 1,
      title: "Connect",
      descPending: "Waiting to connect...",
      descActive: "Linking Google Profile...",
      descDone: "Profile Linked",
      icon: QrCode,
      color: "text-blue-500",
      bg: "bg-blue-100",
      border: "border-blue-200",
    },
    {
      id: 2,
      title: "Capture",
      descPending: "Waiting for scan...",
      descActive: "Customer scanning QR...",
      descDone: "5-Star Rating Captured",
      icon: Star,
      color: "text-purple-500",
      bg: "bg-purple-100",
      border: "border-purple-200",
    },
    {
      id: 3,
      title: "Route",
      descPending: "Waiting for rating...",
      descActive: "Analyzing sentiment...",
      descDone: "Routed to Google Maps",
      icon: GitFork,
      color: "text-amber-500",
      bg: "bg-amber-100",
      border: "border-amber-200",
    },
    {
      id: 4,
      title: "Grow",
      descPending: "Waiting for review...",
      descActive: "Updating dashboard...",
      descDone: "Review Published!",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-100",
      border: "border-emerald-200",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto my-16 p-8 rounded-[40px] bg-white shadow-2xl border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
        <div
          className="h-full bg-brand transition-all duration-1000 ease-linear"
          style={{ width: `${(Math.min(step, 4) / 4) * 100}%` }}
        />
      </div>

      <div className="text-center mb-12 relative z-10 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/5 text-brand font-bold text-sm mb-6 border border-brand/10 shadow-sm">
          {step < 5 ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Live Simulation
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          See What Happens When a Customer{" "}
          <span className="text-brand">Scans Your QR Code</span>
        </h2>
        <p className="text-slate-500 mt-3 font-medium text-lg">
          Watch the full journey in real-time.
        </p>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        {stages.map((stage, i) => {
          const isActive = step === stage.id;
          const isPast = step > stage.id;
          const isPending = step < stage.id;
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className="flex-1 flex flex-col items-center text-center relative w-full"
            >
              {i < stages.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-1 bg-slate-100 rounded-full -z-10 overflow-hidden">
                  <div
                    className="h-full bg-brand transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: isPast ? "100%" : "0%" }}
                  />
                </div>
              )}

              <div
                className={cn(
                  "relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg border-2",
                  isActive && cn(stage.bg, stage.border, "scale-110 shadow-xl"),
                  isPast && cn(stage.bg, stage.border, "opacity-100"),
                  isPending && "bg-white border-slate-100 opacity-50",
                  !isActive && !isPast && !isPending && "bg-white border-slate-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-8 w-8 transition-colors duration-500",
                    (isActive || isPast) ? stage.color : "text-slate-300",
                    isActive && "animate-pulse"
                  )}
                />
                {isPast && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-0.5 shadow-sm animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "mt-6 transition-opacity duration-500",
                  isPending ? "opacity-40" : "opacity-100"
                )}
              >
                <h3 className={cn("font-bold text-lg", (isActive || isPast) ? "text-slate-900" : "text-slate-400")}>
                  {stage.title}
                </h3>
                <p className="text-xs mt-1.5 max-w-[160px] mx-auto h-8 font-medium">
                  {isActive ? (
                    <span className={stage.color}>{stage.descActive}</span>
                  ) : isPast ? (
                    <span className="text-emerald-600 font-bold">{stage.descDone}</span>
                  ) : (
                    <span className="text-slate-400">{stage.descPending}</span>
                  )}
                </p>
              </div>

              {isActive && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black text-brand uppercase tracking-widest animate-pulse bg-brand/10 px-3 py-1 rounded-full">
                  Processing
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Activity Feed */}
      <div className="max-w-3xl mx-auto bg-slate-900 rounded-2xl p-5 shadow-xl font-mono text-sm text-left overflow-hidden relative mb-8 border border-slate-800">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="ml-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">System Event Log</span>
        </div>
        <div className="space-y-3 h-[140px] overflow-hidden flex flex-col justify-end pb-2">
          {step >= 1 && (
            <div className="text-blue-400 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
              ➔ [System]: Smart QR Code generated & linked to Google Profile.
            </div>
          )}
          {step >= 2 && (
            <div className="text-purple-400 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
              ➔ [Customer]: Scanned QR code at Table 4. Selected 5-star rating.
            </div>
          )}
          {step >= 3 && (
            <div className="text-amber-400 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
              ➔ [Engine]: 5-star rating detected. Bypassing private form. Routing directly to Google Maps...
            </div>
          )}
          {step >= 4 && (
            <div className="text-emerald-400 animate-in fade-in slide-in-from-bottom-2 duration-500 font-bold">
              <span className="text-slate-500 mr-2 font-normal">[{new Date().toLocaleTimeString()}]</span>
              ➔ [Google]: New 5-star review published! Dashboard metrics updated.
            </div>
          )}
          {step === 0 && (
            <div className="text-slate-500 animate-pulse">
              Waiting for customer scan...
            </div>
          )}
        </div>
      </div>

      {step === 5 && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="p-10 rounded-3xl bg-gradient-to-br from-brand/5 to-indigo-50 border border-brand/10 shadow-inner text-center relative">
            <h4 className="text-3xl font-black text-slate-900 mb-3">
              Reputation Protected & Growing
            </h4>
            <p className="text-slate-600 mb-10 font-medium text-lg max-w-2xl mx-auto">
              Happy customers left Google reviews. Unhappy ones were handled
              privately before going public.
            </p>

            <div className="relative max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-white/95 z-10 flex flex-col items-center justify-end pb-12 backdrop-blur-[1px]">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="primary-button h-14 px-8 rounded-2xl shadow-xl shadow-brand/20 inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:scale-105 transition-transform"
                  >
                    Get Started Free{" "}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setPlayCount(p => p + 1)}
                    className="h-14 px-8 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 font-black uppercase tracking-widest text-sm hover:bg-slate-50 hover:border-slate-300 transition-all inline-flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Replay
                  </button>
                </div>
              </div>
              
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                <div className="font-black text-slate-900 text-sm tracking-tight">
                  Dashboard Preview
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Data</div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Reviews This Month", value: "24", change: "+12%" },
                    { label: "Private Issues", value: "4", change: "-2%" },
                    { label: "QR Scans", value: "188", change: "+45%" },
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-left">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</div>
                      <div className="flex items-end gap-2">
                        <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                        <div className={`text-xs font-bold mb-1 ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {stat.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3 text-left">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Recent Activity</div>
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 bg-white">
                      <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold text-sm">
                        {i === 1 ? 'SM' : 'JD'}
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-slate-200 rounded w-1/3 mb-2" />
                        <div className="h-2 bg-slate-100 rounded w-1/4" />
                      </div>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} className="w-4 h-4 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
