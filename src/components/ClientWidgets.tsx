'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// Client-only dynamic imports
const ClientAuthSync = dynamic(() => import('./ClientAuthSync'), { ssr: false });
const TawkMessenger = dynamic(() => import('./TawkMessenger'), { ssr: false });
const ExitIntentPopup = dynamic(() => import('./ExitIntentPopup'), { ssr: false });
const AccessibilityChecker = dynamic(() => import('./AccessibilityChecker'), { ssr: false });
const JumpToTop = dynamic(() => import('./JumpToTop'), { ssr: false });

function isAuthPath(pathname: string | null) {
  if (!pathname) return false;
  return /^\/(login|register|forgot|verify-email)(\/|$)/.test(pathname);
}

export default function ClientWidgets() {
  const pathname = usePathname();
  const showTawk = !isAuthPath(pathname);

  return (
    <>
      <ClientAuthSync />
      {showTawk ? (
        <TawkMessenger
          propertyId={process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || '6775ba6daf2b1b669d6b6bf4'}
          widgetId={process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || '1igidguvt'}
        />
      ) : null}
      {/* <ExitIntentPopup delay={5000} cookieExpiry={7} /> */}
      <JumpToTop />
      {process.env.NODE_ENV === 'development' && <AccessibilityChecker />}
    </>
  );
}






















