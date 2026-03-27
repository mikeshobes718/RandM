"use client";
import { useEffect, useState } from "react";

export default function JumpToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 left-auto right-4 sm:right-6 z-[100] p-3 bg-primary text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center animate-fade-in md:bottom-6"
      aria-label="Jump to top"
    >
      <span className="material-symbols-outlined">arrow_upward</span>
    </button>
  );
}