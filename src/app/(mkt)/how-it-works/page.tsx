"use client";

import Link from "next/link";
import ClientCTA from "@/components/ClientCTA";
import { useEffect, useState } from "react";

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [logs, setLogs] = useState([
    { time: "[14:20:01]", type: "SUCCESS:", text: "Smart QR Code generated for business_id_492", color: "text-secondary-fixed-dim" },
    { time: "[14:21:45]", type: "EVENT:", text: "Scanned QR code at Table 4 (Session: XP-292)", color: "text-primary-fixed-dim" },
    { time: "[14:22:12]", type: "SIGNAL:", text: "5-star rating detected - Routing to Google Reviews", color: "text-tertiary-fixed" },
    { time: "[14:23:05]", type: "PUSH:", text: "New 5-star review published! Total reach +2.4k", color: "text-secondary font-bold" }
  ]);

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setCurrentTime(`[${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}:${new Date().getSeconds().toString().padStart(2, '0')}]`);
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(`[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const getTime = () => {
      const now = new Date();
      return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    };
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    const runSimulation = async () => {
      // Initial wait before starting live simulation
      await sleep(3000);
      
      while (isMounted) {
        // Step 1: Connect
        setActiveStep(0);
        setLogs(prev => [...prev.slice(-4), { time: getTime(), type: "SUCCESS:", text: "Smart QR Code generated and active", color: "text-secondary-fixed-dim" }]);
        await sleep(3000);
        if (!isMounted) break;
        
        // Step 2: Capture
        setActiveStep(1);
        setLogs(prev => [...prev.slice(-4), { time: getTime(), type: "EVENT:", text: "Customer scanned QR code (Session: XP-292)", color: "text-primary-fixed-dim" }]);
        await sleep(2500);
        if (!isMounted) break;
        
        // Step 3: Route
        setActiveStep(2);
        setLogs(prev => [...prev.slice(-4), { time: getTime(), type: "SIGNAL:", text: "5-star rating detected - Routing to Google", color: "text-tertiary-fixed" }]);
        await sleep(2500);
        if (!isMounted) break;
        
        // Step 4: Grow
        setActiveStep(3);
        setLogs(prev => [...prev.slice(-4), { time: getTime(), type: "PUSH:", text: "New 5-star review published! Total reach +2.4k", color: "text-secondary font-bold" }]);
        await sleep(4000);
        if (!isMounted) break;
        
        // Reset
        setLogs(prev => [...prev.slice(-4), { time: getTime(), type: "INFO:", text: "Session closed. Waiting for next interaction...", color: "text-white/40 italic" }]);
        await sleep(2000);
      }
    };
    
    runSimulation();
    return () => { isMounted = false; };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <header className="text-center mb-24 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold tracking-widest uppercase mb-6">
            <span className="relative flex h-2 w-2">
              <span className="md:animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
            Live Simulation
          </div>
          <h1 className="display-font text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface mb-6">
            How Reviews &amp; Marketing Works
          </h1>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Experience the seamless bridge between physical customer interaction and digital reputation growth.
            Our automated engine captures sentiment in real-time.
          </p>
        </header>

        {/* Process Flow Container */}
        <div id="simulation" className="relative bg-surface-container-low p-8 md:p-16 rounded-[2rem] overflow-hidden mb-20">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-fixed/30 rounded-full blur-3xl" />

          {/* 4-Step Horizontal Process */}
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8 md:gap-4">
            {/* Background Line */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-[2px] bg-outline-variant/30 -z-10">
               <div 
                 className="h-full bg-primary rounded-full transition-all duration-1000 ease-in-out" 
                 style={{ width: `${(activeStep / 3) * 100}%` }}
               />
            </div>

            {[
              { icon: "qr_code", color: "text-primary", bg: "bg-surface-container-lowest", title: "1. Connect", desc: "Profile Linked and ready for customer scans." },
              { icon: "star", color: "text-secondary", bg: "bg-surface-container-lowest", title: "2. Capture", desc: "5-Star Rating Captured instantly at point of sale.", fill: true },
              { icon: "account_tree", color: "text-tertiary", bg: "bg-surface-container-lowest", title: "3. Route", desc: "Analyzing sentiment and directing feedback." },
              { icon: "trending_up", color: "text-on-primary", bg: "bg-primary", title: "4. Grow", desc: "Waiting for review to publish and boost SEO." },
            ].map((step, i) => {
              const isActive = activeStep === i;
              const isPast = activeStep > i;
              return (
              <div key={step.title} className={`flex flex-col items-center text-center group flex-1 transition-opacity duration-500 ${isActive || isPast ? 'opacity-100' : 'opacity-40'}`}>
                <div className="relative mb-6">
                  <div className={`w-16 h-16 rounded-2xl ${isActive ? 'bg-primary text-white shadow-xl scale-110' : (isPast ? 'bg-primary-container text-on-primary-container' : step.bg + ' ' + step.color)} flex items-center justify-center shadow-lg transition-all duration-500`}>
                    <span
                      className={`material-symbols-outlined text-3xl`}
                      style={step.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {step.icon}
                    </span>
                  </div>
                </div>
                <h3 className="display-font text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-on-surface-variant text-sm px-4">{step.desc}</p>
              </div>
            )})}
          </div>

          {/* System Event Log */}
          <div className="mt-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="display-font text-xl font-extrabold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">terminal</span>
                System Event Log
              </h2>
              <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-error" />
                </span>
                Live Feed &bull; Node_082
              </span>
            </div>
            <div className="bg-on-surface rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-2 bg-on-surface-variant/20 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-error" />
                <div className="w-2.5 h-2.5 rounded-full bg-secondary-fixed" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed" />
              </div>
              <div className="p-6 font-mono text-sm space-y-3 min-h-[200px]">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <span className="text-white/30">{log.time}</span>
                    <span className={log.color}>{log.type}</span>
                    <span className={log.type === "PUSH:" ? "text-white font-bold" : "text-white/80"}>{log.text}</span>
                  </div>
                ))}
                <div className="flex gap-4 pt-2">
                  <span className="text-white/30">{currentTime}</span>
                  <span className="text-white/40 italic">Waiting for next interaction...</span>
                  <span className="w-2 h-4 bg-white/40 animate-blink" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Info Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="md:col-span-2 bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-outline-variant/10">
            <h4 className="display-font text-2xl font-bold mb-4">Precision Sentiment Routing</h4>
            <p className="text-on-surface-variant mb-6 leading-relaxed">
              Our system doesn&apos;t just collect data; it understands intent. High-value promoters are fast-tracked to public platforms, while constructive feedback is routed to your private dashboard for immediate resolution.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-secondary-container/20 flex items-center gap-4">
                <span className="material-symbols-outlined text-secondary">check_circle</span>
                <span className="text-sm font-semibold">99.2% Accuracy</span>
              </div>
              <div className="p-4 rounded-2xl bg-primary-container/10 flex items-center gap-4">
                <span className="material-symbols-outlined text-primary">speed</span>
                <span className="text-sm font-semibold">&lt; 200ms Latency</span>
              </div>
            </div>
          </div>
          <div className="bg-primary-container p-8 rounded-3xl text-on-primary-container flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-4xl mb-4">auto_awesome</span>
              <h4 className="display-font text-2xl font-bold mb-2">Auto-Pilot Marketing</h4>
              <p className="opacity-80 text-sm">Let the system handle the heavy lifting while you focus on the customer experience.</p>
            </div>
            <Link href="/features" className="mt-8 py-3 px-6 bg-white text-primary font-bold rounded-xl hover:bg-slate-50 transition-colors inline-block text-center">
              Explore Automation
            </Link>
          </div>
        </section>

        {/* Smart QR Advantage */}
        <section className="flex flex-col md:flex-row items-center gap-12 mb-20">
          <div className="flex-1">
            <h2 className="display-font text-4xl font-extrabold mb-6 tracking-tight">The Smart QR Advantage</h2>
            <p className="text-on-surface-variant text-lg mb-8">
              Each QR code is unique to the table, employee, or location. Gain granular insights into where your best experiences are happening.
            </p>
            <ul className="space-y-4">
              {[
                "No app download required for customers",
                "Dynamic destination updates (Google, Yelp, Facebook)",
                "Detailed scanning heatmaps and peak hour analytics",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-1">task_alt</span>
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full flex justify-center">
            <Link href="#simulation" className="w-full max-w-md aspect-square rounded-[3rem] overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 bg-surface-container-high flex items-center justify-center group">
              <div className="text-center p-8 flex flex-col items-center">
                <div className="w-48 h-48 mb-6 bg-white rounded-2xl p-2 shadow-sm group-hover:scale-105 transition-transform duration-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/api/qr?data=https://reviewsandmarketing.com/how-it-works%23simulation&format=png&scale=8" 
                    alt="Scan to experience the flow" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-sm text-on-surface-variant font-medium uppercase tracking-widest flex items-center gap-2">
                  Scan to experience the flow
                  <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Video */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl bg-surface-container-low">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/y0Jb0wNecfk?autoplay=0&rel=0"
              title="Reviews & Marketing Explainer Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* CTA */}
        <div className="p-12 primary-gradient rounded-2xl text-center text-white relative overflow-hidden shadow-xl">
          <h2 className="text-3xl font-extrabold text-white mb-5 drop-shadow-md">Ready to start building your reputation?</h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto font-medium">
            Join thousands of businesses using Reviews &amp; Marketing to grow their online presence the compliant way.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <ClientCTA text="Get Started For Free" className="h-12 px-8 bg-white text-primary rounded-lg font-bold text-sm inline-flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm" />
            <Link href="/pricing" className="text-sm font-bold text-white/90 hover:text-white transition-colors">
              View Plans &amp; Pricing &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
