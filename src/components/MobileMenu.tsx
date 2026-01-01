"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2.5 text-slate-600 hover:text-brand transition-all focus:outline-none bg-slate-50 rounded-2xl border border-slate-200 active:scale-95"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Fullscreen Menu Overlay */}
      <div 
        className={`fixed inset-0 w-full h-screen z-[99999] bg-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full w-full bg-white relative overflow-hidden">
          {/* Menu Header - Solid & Fixed */}
          <div className="flex items-center justify-between px-8 h-20 border-b border-slate-100 bg-white flex-shrink-0">
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-brand leading-none">R&M</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Navigation Menu</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2.5 text-slate-400 hover:text-brand transition-all rounded-xl bg-slate-50 border border-slate-100 active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 px-6 py-8 overflow-y-auto bg-white flex flex-col gap-4">
            {[
              { 
                href: '/how-it-works', 
                label: 'How it works', 
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                color: 'text-blue-600',
                bg: 'bg-blue-50'
              },
              { 
                href: '/features', 
                label: 'Features', 
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                ),
                color: 'text-brand',
                bg: 'bg-brand/5'
              },
              { 
                href: '/pricing', 
                label: 'Pricing', 
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                color: 'text-emerald-600',
                bg: 'bg-emerald-50'
              },
              { 
                href: '/blog', 
                label: 'Blog', 
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                ),
                color: 'text-purple-600',
                bg: 'bg-purple-50'
              },
            ].map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`flex items-center gap-5 px-6 py-5 rounded-[24px] transition-all group ${
                  pathname === link.href 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-[1.02]' 
                  : 'text-slate-900 bg-slate-50 border border-slate-100 hover:bg-white hover:border-brand/20 active:scale-95'
                }`}
              >
                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                  pathname === link.href 
                  ? 'bg-white/10 text-white' 
                  : `${link.bg} ${link.color} group-hover:scale-110`
                }`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {link.icon}
                  </svg>
                </div>
                <span className="text-xl font-black">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Footer Actions - Solid Background */}
          <div className="p-8 border-t border-slate-100 bg-slate-50 space-y-4 pb-12 flex-shrink-0">
            <Link
              href="/register"
              className="primary-button w-full h-16 flex items-center justify-center text-lg font-black uppercase tracking-widest shadow-xl shadow-brand/30 active:scale-[0.98] transition-all"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="secondary-button w-full h-16 flex items-center justify-center text-lg font-black border-2 border-slate-200 bg-white hover:border-brand/20 active:scale-[0.98] transition-all"
            >
              Sign In
            </Link>
            <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure SSL Platform
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
