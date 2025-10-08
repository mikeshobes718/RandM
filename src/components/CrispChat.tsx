'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

interface CrispChatProps {
  websiteId?: string;
}

export default function CrispChat({ websiteId }: CrispChatProps) {
  const crispId = websiteId || process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

  useEffect(() => {
    if (!crispId) {
      console.warn('Crisp Website ID not configured');
      return;
    }

    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = crispId;

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.getElementsByTagName('head')[0].appendChild(script);

    // Configure Crisp
    script.onload = () => {
      // Set user data if available
      try {
        const idToken = localStorage.getItem('idToken');
        if (idToken) {
          // Decode token to get email (basic JWT parsing)
          const payload = idToken.split('.')[1];
          if (payload) {
            const decoded = JSON.parse(atob(payload));
            if (decoded.email) {
              window.$crisp.push(['set', 'user:email', [decoded.email]]);
            }
          }
        }
      } catch (error) {
        console.warn('Could not set Crisp user data:', error);
      }

      // Set custom data
      window.$crisp.push(['set', 'session:data', [[
        ['source', 'website'],
        ['plan', 'visitor'],
      ]]]);
    };

    return () => {
      // Cleanup if needed
      if (window.$crisp) {
        window.$crisp.push(['do', 'chat:hide']);
      }
    };
  }, [crispId]);

  return null; // This component doesn't render anything
}

// Optional: Helper functions to interact with Crisp from other components
export const CrispHelpers = {
  show: () => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:show']);
    }
  },
  hide: () => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:hide']);
    }
  },
  open: () => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:open']);
    }
  },
  sendMessage: (message: string) => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'message:send', ['text', message]]);
    }
  },
  setUserEmail: (email: string) => {
    if (window.$crisp) {
      window.$crisp.push(['set', 'user:email', [email]]);
    }
  },
  setUserName: (name: string) => {
    if (window.$crisp) {
      window.$crisp.push(['set', 'user:nickname', [name]]);
    }
  },
};

