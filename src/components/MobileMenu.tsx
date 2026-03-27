"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileMenuProps {
  authed: boolean;
  onLogout: () => void;
}

export default function MobileMenu({ authed, onLogout }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/how-it-works', label: 'How It Works', icon: 'play_circle' },
    { href: '/features', label: 'Features', icon: 'auto_awesome' },
    { href: '/pricing', label: 'Pricing', icon: 'payments' },
    { href: '/blog', label: 'Blog', icon: 'article' },
  ];

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
      </button>

      <div
        className={`fixed inset-0 z-[99999] h-[100dvh] w-full touch-none overscroll-none transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-surface">
          <div className="flex h-16 flex-shrink-0 touch-auto items-center justify-between border-b border-outline-variant/10 px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg primary-gradient">
                <span className="text-sm font-extrabold text-on-primary">R</span>
              </div>
              <span className="text-base font-extrabold tracking-tight text-on-surface display-font">R&M</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
            </button>
          </div>

          <div className="flex min-h-0 flex-1 touch-pan-y flex-col gap-1.5 overflow-y-auto overscroll-contain px-4 py-6 [-webkit-overflow-scrolling:touch]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                  pathname === link.href
                    ? 'bg-primary/8 text-primary'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{link.icon}</span>
                <span className="text-base font-semibold">{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex-shrink-0 border-t border-outline-variant/10 p-4 pb-8 space-y-3">
            {authed ? (
              <>
                <Link
                  href="/dashboard"
                  className="primary-button w-full h-14 flex items-center justify-center text-base font-bold"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => { onLogout(); setIsOpen(false); }}
                  className="secondary-button w-full h-14 flex items-center justify-center text-base font-semibold"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="primary-button w-full h-14 flex items-center justify-center text-base font-bold"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/login"
                  className="secondary-button w-full h-14 flex items-center justify-center text-base font-semibold"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
