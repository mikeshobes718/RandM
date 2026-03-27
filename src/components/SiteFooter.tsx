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
    <footer className="bg-inverse-surface text-inverse-on-surface mt-0">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-extrabold text-on-primary">R</span>
              </div>
              <span className="text-base font-extrabold tracking-tight display-font">R&M</span>
            </Link>
            <p className="text-inverse-on-surface/60 text-sm leading-relaxed max-w-sm">
              The smartest way to collect 5-star Google reviews. One connected workspace for review links, QR codes, and real-time customer feedback.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="https://www.instagram.com/reviews5marketing?igsh=dHIwbmNqd2w2enVy" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors" aria-label="Instagram">
                <span className="material-symbols-outlined text-inverse-on-surface/60" style={{ fontSize: 18 }}>photo_camera</span>
              </a>
              <a href="https://www.facebook.com/people/Reviews-Marketing/61586440390598/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors" aria-label="Facebook">
                <span className="material-symbols-outlined text-inverse-on-surface/60" style={{ fontSize: 18 }}>group</span>
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <h3 className="text-[11px] font-bold text-inverse-on-surface/40 uppercase tracking-widest mb-5">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-inverse-on-surface/60 hover:text-inverse-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2">
            <h3 className="text-[11px] font-bold text-inverse-on-surface/40 uppercase tracking-widest mb-5">Connect</h3>
            <ul className="space-y-3">
              <li><a href="https://www.instagram.com/reviews5marketing?igsh=dHIwbmNqd2w2enVy" target="_blank" rel="noopener noreferrer" className="text-sm text-inverse-on-surface/60 hover:text-inverse-primary transition-colors">Instagram</a></li>
              <li><a href="https://www.facebook.com/people/Reviews-Marketing/61586440390598/" target="_blank" rel="noopener noreferrer" className="text-sm text-inverse-on-surface/60 hover:text-inverse-primary transition-colors">Facebook</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-inverse-on-surface/30 text-xs font-medium">
            &copy; 2026 Reviews & Marketing. All rights reserved.
          </p>
          <p className="text-inverse-on-surface/20 text-xs font-medium">
            Built in NYC
          </p>
        </div>
      </div>
    </footer>
  );
}
