"use client";

import { useEffect, useId, useRef, useState } from "react";

type InfoTipProps = {
  text: string;
  compact?: boolean;
  align?: "start" | "end";
};

export default function InfoTip({ text, compact, align = "start" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const id = useId();
  const tipId = `${id}-tip`;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <span ref={rootRef} className="relative inline-flex align-middle">
      <button
        type="button"
        className={`inline-flex shrink-0 items-center justify-center rounded-full text-on-surface-variant/70 transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${compact ? "p-0.5" : "p-1"}`}
        aria-label="More information"
        aria-expanded={open}
        aria-controls={open ? tipId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`material-symbols-outlined leading-none ${compact ? "text-[14px]" : "text-[18px]"}`}>
          info
        </span>
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className={`absolute z-[9999] mt-1.5 w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-slate-900 px-3 py-2 text-left text-[11px] font-medium leading-snug text-white shadow-xl ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
