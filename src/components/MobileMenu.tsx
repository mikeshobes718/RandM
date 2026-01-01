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
        className="p-2 text-slate-600 hover:text-brand transition-colors focus:outline-none bg-slate-50 rounded-xl border border-slate-200 shadow-sm"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Side Sheet */}
      <div 
        className={`fixed inset-y-0 right-0 z-[9999] w-[85%] max-w-[320px] bg-white shadow-[-20px_0_80px_rgba(0,0,0,0.15)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ height: '100dvh' }}
      >
        <div className="flex flex-col h-full bg-white overflow-hidden">
          {/* Menu Header */}
          <div className="flex items-center justify-between px-6 h-20 border-b border-slate-50 flex-shrink-0">
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-brand leading-none">R&M</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Menu</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-brand transition-all rounded-xl bg-slate-50 border border-slate-100"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
            <nav className="flex flex-col gap-1.5">
              {[
                { href: '/how-it-works', label: 'How it works', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { href: '/features', label: 'Features', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z' },
                { href: '/pricing', label: 'Pricing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { href: '/blog', label: 'Blog', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
              ].map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-base font-bold transition-all ${
                    pathname === link.href 
                    ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${pathname === link.href ? 'bg-white/20' : 'bg-slate-100'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                    </svg>
                  </div>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/5 space-y-3 flex-shrink-0">
            <Link
              href="/register"
              className="primary-button w-full h-14 flex items-center justify-center text-sm font-black uppercase tracking-widest shadow-lg shadow-brand/20"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="secondary-button w-full h-14 flex items-center justify-center text-sm font-bold border border-slate-200 bg-white shadow-sm"
            >
              Sign In
            </Link>
            <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">
              Reviews \u0026 Marketing Admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
