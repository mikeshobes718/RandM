"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import AdminGuard from "@/components/admin/AdminGuard";

const NAV_ITEMS = [
  { name: "Overview", href: "/admin", icon: <span className="material-symbols-outlined text-xl">home</span> },
  { name: "Access Control", href: "/admin/reps", icon: <span className="material-symbols-outlined text-xl">group</span> },
  { name: "Call Logs", href: "/admin/calls", icon: <span className="material-symbols-outlined text-xl">call_log</span> },
  { name: "Leads", href: "/admin/leads", icon: <span className="material-symbols-outlined text-xl">person_search</span> },
  { name: "Customers", href: "/admin/customers", icon: <span className="material-symbols-outlined text-xl">storefront</span> },
  { name: "Usage Log", href: "/admin/usage-log", icon: <span className="material-symbols-outlined text-xl">monitoring</span> },
  { name: "Portals", href: "/admin/portals", icon: <span className="material-symbols-outlined text-xl">link</span> },
  { name: "Settings", href: "/admin/settings", icon: <span className="material-symbols-outlined text-xl">settings</span> },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-surface-container-lowest flex">
        <aside className="w-64 bg-inverse-surface text-white flex flex-col fixed inset-y-0 shadow-2xl z-50">
          <div className="p-8">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">
                R
              </div>
              <div>
                <span className="font-black text-xl tracking-tight block">R&M Admin</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-inverse-on-surface/40">Internal Panel</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-inverse-on-surface/50 hover:text-inverse-on-surface hover:bg-inverse-on-surface/5"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-inverse-on-surface/40 group-hover:text-inverse-on-surface/60"}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 mt-auto border-t border-white/5">
            <button
              type="button"
              className="group flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold text-inverse-on-surface/50 hover:text-inverse-on-surface hover:bg-inverse-on-surface/5 transition-all"
            >
              <span className="material-symbols-outlined text-xl text-inverse-on-surface/40 group-hover:text-inverse-on-surface/60">
                logout
              </span>
              Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-64 p-8 sm:p-12 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
