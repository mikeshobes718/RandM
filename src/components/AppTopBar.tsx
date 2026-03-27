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
    <header className="sticky top-0 z-30 w-full h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/20 shadow-sm flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 display-font">
          R&M
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-slate-200/50 rounded-full transition-colors" aria-label="Notifications">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </button>
        <button className="p-2 hover:bg-slate-200/50 rounded-full transition-colors" aria-label="Help">
          <span className="material-symbols-outlined text-on-surface-variant">help_outline</span>
        </button>
        <div
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold ml-2"
          title={email}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
