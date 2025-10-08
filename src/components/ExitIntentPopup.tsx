'use client';

import { useState, useEffect } from 'react';
import NewsletterSignup from './NewsletterSignup';

interface ExitIntentPopupProps {
  delay?: number; // Delay before enabling exit intent (ms)
  cookieExpiry?: number; // Days before showing again
}

export default function ExitIntentPopup({ delay = 3000, cookieExpiry = 7 }: ExitIntentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = typeof document !== 'undefined' && document.cookie.includes('exit_intent_shown=true');
    if (hasSeenPopup) return;

    // Enable exit intent after delay
    const timer = setTimeout(() => {
      setEnabled(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Check cookie again before opening (in case it was set during this session)
      const hasSeenPopup = document.cookie.includes('exit_intent_shown=true');
      if (hasSeenPopup) return;

      // Only trigger if mouse is leaving from the top of the page
      if (e.clientY <= 0) {
        setIsOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [enabled, cookieExpiry]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSuccess = () => {
    // Set cookie when user successfully subscribes (not when popup opens)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + cookieExpiry);
    document.cookie = `exit_intent_shown=true; expires=${expiryDate.toUTCString()}; path=/; samesite=lax`;
    
    setTimeout(handleClose, 2000);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 pointer-events-auto transform transition-all animate-fade-in-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <NewsletterSignup variant="modal" onSuccess={handleSuccess} />
        </div>
      </div>
    </>
  );
}

// Add CSS for animations
const style = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = style;
  document.head.appendChild(styleSheet);
}

