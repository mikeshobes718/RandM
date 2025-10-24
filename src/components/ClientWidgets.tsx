'use client';

import dynamic from 'next/dynamic';

// Client-only dynamic imports
const ClientAuthSync = dynamic(() => import('./ClientAuthSync'), { ssr: false });
const CrispChat = dynamic(() => import('./CrispChat'), { ssr: false });
const ExitIntentPopup = dynamic(() => import('./ExitIntentPopup'), { ssr: false });
const AccessibilityChecker = dynamic(() => import('./AccessibilityChecker'), { ssr: false });

export default function ClientWidgets() {
  return (
    <>
      <ClientAuthSync />
      <CrispChat />
      <ExitIntentPopup delay={5000} cookieExpiry={7} />
      {process.env.NODE_ENV === 'development' && <AccessibilityChecker />}
    </>
  );
}


