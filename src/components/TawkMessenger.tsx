'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: any;
  }
}

interface TawkMessengerProps {
  propertyId: string;
  widgetId: string;
}

export default function TawkMessenger({ propertyId, widgetId }: TawkMessengerProps) {
  useEffect(() => {
    if (!propertyId || !widgetId) {
      console.warn('Tawk.to Property ID or Widget ID not configured');
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    
    const s0 = document.getElementsByTagName('script')[0];
    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(script, s0);
    } else {
      document.head.appendChild(script);
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    return () => {
      // Cleanup if needed
      try {
        if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
          window.Tawk_API.hideWidget();
        }
      } catch (e) {
        console.warn('Tawk cleanup error:', e);
      }
    };
  }, [propertyId, widgetId]);

  return null;
}


