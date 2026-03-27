"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type InfoTipProps = {
  text: string;
  compact?: boolean;
  align?: "start" | "end";
};

function clampTooltipPosition(
  trigger: DOMRect,
  tipW: number,
  tipH: number,
  align: "start" | "end"
) {
  const margin = 10;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 6;

  let left = align === "end" ? trigger.right - tipW : trigger.left;
  left = Math.max(margin, Math.min(left, vw - tipW - margin));

  let top = trigger.bottom + gap;
  if (top + tipH > vh - margin) {
    top = trigger.top - tipH - gap;
  }
  top = Math.max(margin, Math.min(top, vh - tipH - margin));

  return { top, left };
}

export default function InfoTip({ text, compact, align = "start" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const id = useId();
  const tipId = `${id}-tip`;

  const reposition = useCallback(() => {
    const root = rootRef.current;
    const tip = tipRef.current;
    if (!open || !root || !tip) return;
    const trigger = root.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    if (w === 0 || h === 0) return;
    setPos(clampTooltipPosition(trigger, w, h, align));
    setReady(true);
  }, [open, align]);

  useLayoutEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    reposition();
  }, [open, align, text, reposition]);

  useEffect(() => {
    if (!open || !tipRef.current) return;
    const el = tipRef.current;
    const ro = new ResizeObserver(() => reposition());
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, reposition, text]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const opts = { capture: true, passive: true } as const;
    window.addEventListener("scroll", reposition, opts);
    window.addEventListener("resize", reposition);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", reposition);
    vv?.addEventListener("scroll", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, opts);
      window.removeEventListener("resize", reposition);
      vv?.removeEventListener("resize", reposition);
      vv?.removeEventListener("scroll", reposition);
    };
  }, [open, reposition]);

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
          ref={tipRef}
          role="tooltip"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 99999,
          }}
          className={`mt-0 w-[min(18rem,calc(100vw-1.25rem))] rounded-lg bg-slate-900 px-3 py-2 text-left text-[11px] font-medium leading-snug text-white shadow-xl transition-opacity duration-75 ${
            ready ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
