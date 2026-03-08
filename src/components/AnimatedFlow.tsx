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
} from "lucide-react";
import Link from "next/link";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function AnimatedFlow() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 3500),
      setTimeout(() => setStep(3), 6000),
      setTimeout(() => setStep(4), 8500),
      setTimeout(() => setStep(5), 11000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const stages = [
    {
      id: 1,
      title: "Connect",
      desc: "Linking your Google profile & QR codes",
      icon: QrCode,
      color: "text-blue-500",
      bg: "bg-blue-100",
      border: "border-blue-200",
    },
    {
      id: 2,
      title: "Capture",
      desc: "Customer scans & leaves rating",
      icon: Star,
      color: "text-purple-500",
      bg: "bg-purple-100",
      border: "border-purple-200",
    },
    {
      id: 3,
      title: "Route",
      desc: "Filtering happy vs. unhappy customers",
      icon: GitFork,
      color: "text-amber-500",
      bg: "bg-amber-100",
      border: "border-amber-200",
    },
    {
      id: 4,
      title: "Grow",
      desc: "Building your public reputation",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-100",
      border: "border-emerald-200",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto my-16 p-8 rounded-3xl bg-white shadow-2xl border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
        <div
          className="h-full bg-brand transition-all duration-1000 ease-linear"
          style={{ width: `${(Math.min(step, 4) / 4) * 100}%` }}
        />
      </div>

      <div className="text-center mb-12 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/5 text-brand font-bold text-sm mb-4 border border-brand/10">
          <Loader2 className="h-4 w-4 animate-spin" />
          Live Simulation
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900">
          See What Happens When a Customer{" "}
          <span className="text-brand">Scans Your QR Code</span>
        </h2>
        <p className="text-slate-500 mt-2 font-medium">
          Watch the full journey in real-time.
        </p>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gray-100 -z-10">
                  <div
                    className="h-full bg-brand transition-all duration-1000 ease-linear"
                    style={{ width: isPast ? "100%" : "0%" }}
                  />
                </div>
              )}

              <div
                className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg border-2",
                  isActive &&
                    cn(stage.bg, stage.border, "scale-110 shadow-xl"),
                  isPast && "bg-gray-50 border-gray-200",
                  isPending && "bg-white border-gray-100 opacity-50",
                  !isActive && !isPast && !isPending && "bg-white border-gray-100"
                )}
              >
                {isPast ? (
                  <CheckCircle2 className="h-8 w-8 text-gray-400" />
                ) : (
                  <Icon
                    className={cn(
                      "h-8 w-8",
                      isActive ? stage.color : "text-gray-300",
                      isActive && "animate-pulse"
                    )}
                  />
                )}
              </div>

              <div
                className={cn(
                  "mt-6 transition-opacity duration-500",
                  isPending ? "opacity-40" : "opacity-100"
                )}
              >
                <h3 className="font-bold text-slate-900">{stage.title}</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[150px] mx-auto h-8">
                  {isActive
                    ? stage.desc
                    : isPast
                      ? "Complete"
                      : "Waiting..."}
                </p>
              </div>

              {isActive && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-brand uppercase tracking-widest animate-pulse">
                  Processing
                </div>
              )}
            </div>
          );
        })}
      </div>

      {step === 5 && (
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-brand/5 to-indigo-50 border border-brand/10 shadow-inner text-center">
            <h4 className="text-2xl font-black text-slate-900 mb-2">
              Reputation Protected & Growing
            </h4>
            <p className="text-slate-600 mb-8 font-medium">
              Happy customers left Google reviews. Unhappy ones were handled
              privately before going public.
            </p>

            <div className="relative max-w-2xl mx-auto mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 z-10 flex items-end justify-center pb-8">
                <Link
                  href="/register"
                  className="primary-button h-12 px-8 rounded-full shadow-lg inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest"
                >
                  Get Started Free{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="font-bold text-slate-700 text-sm">
                  Dashboard Preview
                </div>
                <div className="text-xs text-slate-500">Live Data</div>
              </div>
              <div className="p-4 space-y-3 opacity-60 blur-[2px]">
                {[
                  { label: "5-Star Reviews This Month", value: "23" },
                  { label: "Private Issues Resolved", value: "4" },
                  { label: "QR Scans", value: "187" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-100"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-md" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                    <div className="w-20">
                      <div className="h-6 bg-emerald-100 rounded-full w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
