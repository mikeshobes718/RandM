"use client";
import Link from "next/link";
import { usePathname } from 'next/navigation';

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith('/r/')) return null;

  return (
    <footer className="bg-foreground text-white border-t border-white/5 mt-0">
      <div className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-12 gap-12 mb-20">
          <div className="md:col-span-4">
            <Link href="/" className="inline-block mb-6">
              <span className="text-2xl font-black tracking-tighter text-brand">R&M</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The smartest way to collect 5-star Google reviews. One connected workspace for review links, QR codes, and real-time customer feedback.
            </p>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Product</h3>
            <ul className="space-y-4">
              <li><Link href="/features" className="text-sm text-slate-400 hover:text-brand transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-sm text-slate-400 hover:text-brand transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="text-sm text-slate-400 hover:text-brand transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-sm text-slate-400 hover:text-brand transition-colors">About</Link></li>
              <li><Link href="/blog" className="text-sm text-slate-400 hover:text-brand transition-colors">Blog</Link></li>
              <li><Link href="/support" className="text-sm text-slate-400 hover:text-brand transition-colors">Support</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-400 hover:text-brand transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Legal</h3>
            <ul className="space-y-4">
              <li><Link href="/privacy" className="text-sm text-slate-400 hover:text-brand transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-400 hover:text-brand transition-colors">Terms</Link></li>
              <li><Link href="/security" className="text-sm text-slate-400 hover:text-brand transition-colors">Security</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Connect</h3>
            <ul className="space-y-4">
              <li><a href="https://twitter.com/reviewsandmkt" className="text-sm text-slate-400 hover:text-brand transition-colors">Twitter</a></li>
              <li><a href="https://linkedin.com/company/reviewsandmkt" className="text-sm text-slate-400 hover:text-brand transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">
            © 2026 REVIEWS & MARKETING. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Systems Normal</span>
            </div>
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              Built in NYC
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
