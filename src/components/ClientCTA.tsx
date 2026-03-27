"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clientAuth } from "@/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";

export default function ClientCTA({ className, text, loggedInText }: { className?: string, text?: string, loggedInText?: string }) {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('idToken')) {
      setAuthed(true);
    }
    const unsub = onAuthStateChanged(clientAuth, (user) => {
      setAuthed(!!user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className={`${className} animate-pulse bg-white/20 text-transparent pointer-events-none`}>
        {text || "Start Free Trial"}
      </div>
    );
  }

  if (authed) {
    return (
      <Link href="/dashboard" className={className}>
        {loggedInText || "Go to Dashboard"}
      </Link>
    );
  }

  return (
    <Link href="/register" className={className}>
      {text || "Start Free Trial"}
    </Link>
  );
}
