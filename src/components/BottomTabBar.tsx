"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Campaigns", href: "/templates", icon: "campaign" },
  { name: "Feedback", href: "/feedback", icon: "rate_review" },
  { name: "Contacts", href: "/contacts", icon: "group" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-bottom">
      <div className="flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname?.startsWith(tab.href));
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-slate-400"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
