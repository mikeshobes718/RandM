"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clientAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function AppTopBar() {
  const [initials, setInitials] = useState("U");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, (user) => {
      if (user?.email) {
        setEmail(user.email);
        setInitials(user.email.charAt(0).toUpperCase());
      }
    });
    return () => unsub();
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full h-14 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between px-4 md:px-8">
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
    </header>
  );
}
