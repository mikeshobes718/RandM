"use client";
import Link from "next/link";
import { usePathname } from 'next/navigation';

export default function SiteFooter() {
  const pathname = usePathname();
  const isAppPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/contacts') || pathname?.startsWith('/feedback') || pathname?.startsWith('/settings') || pathname?.startsWith('/templates') || pathname?.startsWith('/campaigns') || pathname?.startsWith('/requests') || pathname?.startsWith('/onboarding') || pathname?.startsWith('/integrations');
  if (pathname?.startsWith('/r/') || pathname?.startsWith('/admin') || isAppPage) return null;

  const columns = [
    {
      title: 'Product',
      links: [
        { href: '/how-it-works', label: 'How it works' },
        { href: '/features', label: 'Features' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/dashboard', label: 'Dashboard' },
      ],
    },
    {
      title: 'Company',
      links: [
        { href: '/about', label: 'About' },
        { href: '/blog', label: 'Blog' },
        { href: '/support', label: 'Support' },
        { href: '/contact', label: 'Contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { href: '/privacy', label: 'Privacy' },
        { href: '/terms', label: 'Terms' },
        { href: '/security', label: 'Security' },
      ],
    },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 mt-0">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-extrabold text-white">R</span>
              </div>
              <span className="text-base font-extrabold tracking-tight display-font text-white">R&M</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The smartest way to collect 5-star Google reviews. One connected workspace for review links, QR codes, and real-time customer feedback.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="https://www.instagram.com/reviews5marketing?igsh=dHIwbmNqd2w2enVy" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white hover:scale-110 transition-transform shadow-lg" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://www.facebook.com/people/Reviews-Marketing/61586440390598/" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2] text-white hover:scale-110 transition-transform shadow-lg" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-5">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-5">Connect</h3>
            <ul className="space-y-3">
              <li><a href="https://www.instagram.com/reviews5marketing?igsh=dHIwbmNqd2w2enVy" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors">Instagram</a></li>
              <li><a href="https://www.facebook.com/people/Reviews-Marketing/61586440390598/" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors">Facebook</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs font-medium">
            &copy; 2026 Reviews & Marketing. All rights reserved.
          </p>
          <p className="text-slate-600 text-xs font-medium">
            Built in NYC
          </p>
        </div>
      </div>
    </footer>
  );
}
