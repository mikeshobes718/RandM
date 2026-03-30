"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { clientAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { isAdminEmail } from "@/lib/adminEmails";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard", description: "KPIs, inbox, outreach, and analytics for your business." },
  { name: "Feedback", href: "/feedback", icon: "reviews", description: "Private feedback, Google events, and follow-up tools." },
  { name: "Campaigns", href: "/templates", icon: "campaign", description: "SMS and email templates for review requests and promos." },
  { name: "Contacts", href: "/contacts", icon: "group", description: "Import, segment, and message your customer list." },
  { name: "Settings", href: "/settings", icon: "settings", description: "Account, business profile, team, and integrations." },
];

const ADMIN_NAV_ITEMS = [
  { name: "Admin", href: "/admin", icon: "admin_panel_settings", description: "Internal admin dashboard and tools." },
  { name: "Sales portal", href: "/sales-portal", icon: "storefront", description: "Lead finder, scripts, and rep tools." },
];

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [businessName, setBusinessName] = useState("My Business");
  const [planLabel, setPlanLabel] = useState("Free Plan");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showAdminNav, setShowAdminNav] = useState(false);

  const refreshBusinessHeader = useCallback(async () => {
    const user = clientAuth.currentUser;
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/dashboard/summary", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.business?.name) {
        setBusinessName(data.business.name);
        setPhotoUrl(data.business.google_photo_url ?? null);
        localStorage.setItem("businessData", JSON.stringify(data.business));
      }
      const planName = data.plan || data.planUsage?.planName;
      if (planName) {
        const label =
          typeof planName === "string" ? `${planName} Plan` : "Plan";
        setPlanLabel(label);
        localStorage.setItem("selectedPlan", String(planName).toLowerCase());
      } else if (data.isPro) {
        setPlanLabel("Unlimited Plan");
        localStorage.setItem("selectedPlan", "unlimited");
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("businessData");
    if (stored) {
      try {
        const biz = JSON.parse(stored);
        if (biz.name) setBusinessName(biz.name);
        setPhotoUrl(biz.google_photo_url ?? null);
      } catch {
        /* ignore */
      }
    }
    const unsub = onAuthStateChanged(clientAuth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const meRes = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const me = await meRes.json();
            setShowAdminNav(isAdminEmail(me.email) || me.role === "admin");
          }
          await refreshBusinessHeader();
        } catch {
          /* ignore */
        }
      } else {
        setShowAdminNav(false);
      }
    });

    return () => unsub();
  }, [refreshBusinessHeader]);

  useEffect(() => {
    void refreshBusinessHeader();
  }, [pathname, refreshBusinessHeader]);

  useEffect(() => {
    const onUpdate = () => {
      void refreshBusinessHeader();
    };
    window.addEventListener("businessProfileUpdated", onUpdate);
    return () => window.removeEventListener("businessProfileUpdated", onUpdate);
  }, [refreshBusinessHeader]);

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

  const navLinkClass = (isActive: boolean, iconOnly: boolean) =>
    `flex items-center rounded-lg transition-all text-sm font-medium ${
      iconOnly ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
    } ${
      isActive
        ? "bg-primary-fixed/40 text-primary font-semibold"
        : "text-on-surface-variant hover:bg-surface-container-low hover:translate-x-0.5"
    }`;

  return (
    <aside
      className={`hidden md:flex h-screen fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant/15 flex-col z-40 overflow-hidden transition-[width] duration-200 ease-out ${
        collapsed ? "w-[4.5rem] p-2" : "w-64 p-4"
      }`}
    >
      <div className={`mb-2 shrink-0 ${collapsed ? "flex flex-col items-center gap-2" : "px-2 py-4"}`}>
        <div className={`flex w-full items-center ${collapsed ? "flex-col gap-2" : "gap-3"}`}>
          <div className="w-8 h-8 shrink-0 rounded-lg bg-primary-fixed flex items-center justify-center overflow-hidden border border-outline-variant/10">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary text-lg">business_center</span>
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold text-primary truncate">{businessName}</div>
              <div className="text-[10px] text-on-surface-variant uppercase tracking-widest truncate">{planLabel}</div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="material-symbols-outlined text-xl">{collapsed ? "chevron_right" : "chevron_left"}</span>
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 min-h-0 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              title={`${item.name} — ${item.description}`}
              className={navLinkClass(isActive, collapsed)}
            >
              <span
                className="material-symbols-outlined text-xl shrink-0"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {!collapsed && item.name}
            </Link>
          );
        })}

        {showAdminNav && (
          <div
            className={`mt-8 border-t border-outline-variant/15 pt-4 flex flex-col gap-0.5 ${
              collapsed ? "items-center" : ""
            }`}
          >
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Team</p>
            )}
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || (pathname?.startsWith(`${item.href}/`) ?? false);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={`${item.name} — ${item.description}`}
                  className={navLinkClass(isActive, collapsed)}
                >
                  <span
                    className="material-symbols-outlined text-xl shrink-0"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && item.name}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className={`mt-auto border-t border-outline-variant/15 flex flex-col gap-1 shrink-0 ${collapsed ? "pt-3" : "pt-4"}`}>
        <Link
          href="/requests/new"
          title="New Campaign"
          className={`mb-3 flex items-center justify-center rounded-lg bg-primary font-semibold text-white shadow-sm transition-all hover:bg-primary/90 ${
            collapsed ? "h-10 w-10 p-0 mx-auto" : "w-full py-2.5 text-xs text-center"
          }`}
        >
          {collapsed ? (
            <span className="material-symbols-outlined text-xl">add_circle</span>
          ) : (
            "New Campaign"
          )}
        </Link>
        <Link
          href="/support"
          title="Help Center"
          className={`flex items-center text-on-surface-variant hover:text-on-surface transition-colors text-sm ${
            collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"
          }`}
        >
          <span className="material-symbols-outlined text-xl shrink-0">help</span>
          {!collapsed && "Help Center"}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          className={`flex items-center text-on-surface-variant hover:text-error transition-colors text-sm w-full ${
            collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-2"
          }`}
        >
          <span className="material-symbols-outlined text-xl shrink-0">logout</span>
          {!collapsed && "Log Out"}
        </button>
      </div>
    </aside>
  );
}
