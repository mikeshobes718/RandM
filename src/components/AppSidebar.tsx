"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clientAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Feedback", href: "/feedback", icon: "reviews" },
  { name: "Campaigns", href: "/templates", icon: "campaign" },
  { name: "Contacts", href: "/contacts", icon: "group" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [businessName, setBusinessName] = useState("My Business");
  const [planLabel, setPlanLabel] = useState("Free Plan");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("businessData");
    if (stored) {
      try {
        const biz = JSON.parse(stored);
        if (biz.name) setBusinessName(biz.name);
        if (biz.google_photo_url) setPhotoUrl(biz.google_photo_url);
      } catch {}
    }
    const plan = localStorage.getItem("selectedPlan");
    if (plan) setPlanLabel(plan.charAt(0).toUpperCase() + plan.slice(1) + " Plan");

    const unsub = onAuthStateChanged(clientAuth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/dashboard/summary", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.business?.name) {
              setBusinessName(data.business.name);
              if (data.business.google_photo_url) setPhotoUrl(data.business.google_photo_url);
              localStorage.setItem("businessData", JSON.stringify(data.business));
            }
            if (data.plan) {
              setPlanLabel(data.plan.charAt(0).toUpperCase() + data.plan.slice(1) + " Plan");
              localStorage.setItem("selectedPlan", data.plan);
            }
          }
        } catch (e) {}
      }
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await clientAuth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("idToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("selectedPlan");
      localStorage.removeItem("businessData");
      router.push("/login?signed_out=1");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant/15 flex-col p-4 z-40">
      <div className="px-2 py-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center overflow-hidden border border-outline-variant/10">
            {photoUrl ? (
              <img src={photoUrl} alt={businessName} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary text-lg">business_center</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-primary truncate">{businessName}</div>
            <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">{planLabel}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                isActive
                  ? "bg-primary-fixed/40 text-primary font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:translate-x-0.5"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-outline-variant/15 pt-4 flex flex-col gap-1">
        <Link
          href="/requests/new"
          className="w-full mb-3 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg font-semibold shadow-sm transition-all text-xs text-center block"
        >
          New Campaign
        </Link>
        <Link
          href="/support"
          className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-xl">help</span>
          Help Center
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-error transition-colors text-sm w-full"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Log Out
        </button>
      </div>
    </aside>
  );
}
