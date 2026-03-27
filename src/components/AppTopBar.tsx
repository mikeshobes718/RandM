"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clientAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import { isAdminEmail } from "@/lib/adminEmails";

export default function AppTopBar() {
  const [initials, setInitials] = useState("U");
  const [email, setEmail] = useState("");
  const [showAdminNav, setShowAdminNav] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, async (user) => {
      if (user?.email) {
        setEmail(user.email);
        setInitials(user.email.charAt(0).toUpperCase());
        try {
          const token = await user.getIdToken();
          const meRes = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const me = await meRes.json();
            setShowAdminNav(isAdminEmail(me.email) || me.role === "admin");
          }
        } catch {
          setShowAdminNav(false);
        }
      } else {
        setShowAdminNav(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/10">
      <div className="h-14 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-extrabold text-white">R</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-on-surface">
            R&M
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => alert("No new notifications")}
          className="p-2 hover:bg-surface-container-low rounded-full transition-colors" 
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl">notifications</span>
        </button>
        <Link 
          href="/support"
          className="p-2 hover:bg-surface-container-low rounded-full transition-colors" 
          aria-label="Help"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl">help_outline</span>
        </Link>
        <Link
          href="/settings"
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold ml-1 hover:ring-2 hover:ring-primary/50 transition-all"
          title={email ? `Settings for ${email}` : "Settings"}
        >
          {initials}
        </Link>
      </div>
      </div>

      {showAdminNav && (
        <div className="md:hidden flex gap-2 px-4 pb-2 border-t border-outline-variant/5 bg-surface-container-low/40">
          <Link
            href="/admin"
            className="flex-1 text-center text-xs font-bold py-2 rounded-lg bg-primary/10 text-primary border border-primary/20"
          >
            Admin
          </Link>
          <Link
            href="/sales-portal"
            className="flex-1 text-center text-xs font-bold py-2 rounded-lg bg-primary/10 text-primary border border-primary/20"
          >
            Sales portal
          </Link>
        </div>
      )}
    </header>
  );
}
