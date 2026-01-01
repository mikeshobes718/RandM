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
      <div className={`fixed top-0 right-0 z-[101] h-full w-[280px] bg-white shadow-2xl transition-transform duration-300 ease-out transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10">
            <span className="text-xl font-black tracking-tighter text-brand">R&M</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-brand transition-colors rounded-lg bg-slate-50 border border-slate-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {[
              { href: '/how-it-works', label: 'How it works' },
              { href: '/features', label: 'Features' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/blog', label: 'Blog' },
            ].map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`flex items-center px-4 py-3 rounded-xl text-base font-bold transition-all ${
                  pathname === link.href 
                  ? 'bg-brand/5 text-brand border border-brand/10' 
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-100 space-y-3">
            <Link
              href="/register"
              className="primary-button w-full h-12 flex items-center justify-center text-sm font-black uppercase tracking-widest shadow-lg shadow-brand/20"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="secondary-button w-full h-12 flex items-center justify-center text-sm font-bold border border-slate-200 bg-white shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
