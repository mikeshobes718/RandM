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
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted hover:text-brand transition-colors focus:outline-none"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-background animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="container mx-auto px-6 pt-20 h-full flex flex-col">
            <nav className="flex flex-col gap-6 py-8">
              <Link 
                href="/how-it-works" 
                className={`text-2xl font-black transition-all ${
                  pathname === '/how-it-works' ? 'text-brand' : 'text-slate-900'
                }`}
              >
                How it works
              </Link>
              <Link 
                href="/features" 
                className={`text-2xl font-black transition-all ${
                  pathname === '/features' ? 'text-brand' : 'text-slate-900'
                }`}
              >
                Features
              </Link>
              <Link 
                href="/pricing" 
                className={`text-2xl font-black transition-all ${
                  pathname === '/pricing' ? 'text-brand' : 'text-slate-900'
                }`}
              >
                Pricing
              </Link>
            </nav>

            <div className="mt-auto pb-12 space-y-4">
              <Link
                href="/register"
                className="primary-button w-full h-14 text-lg flex items-center justify-center"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="secondary-button w-full h-14 text-lg flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-6 p-2 text-muted hover:text-brand transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

