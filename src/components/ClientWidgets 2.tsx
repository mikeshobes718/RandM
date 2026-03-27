'use client';

import dynamic from 'next/dynamic';

// Client-only dynamic imports
const ClientAuthSync = dynamic(() => import('./ClientAuthSync'), { ssr: false });
const TawkMessenger = dynamic(() => import('./TawkMessenger'), { ssr: false });
const ExitIntentPopup = dynamic(() => import('./ExitIntentPopup'), { ssr: false });
const AccessibilityChecker = dynamic(() => import('./AccessibilityChecker'), { ssr: false });

export default function ClientWidgets() {
  return (
    <>
      <ClientAuthSync />
      <TawkMessenger 
        propertyId={process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || '6775ba6daf2b1b669d6b6bf4'} 
        widgetId={process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || '1igidguvt'} 
      />
      {/* <ExitIntentPopup delay={5000} cookieExpiry={7} /> */}
      {process.env.NODE_ENV === 'development' && <AccessibilityChecker />}
    </>
  );
}






















