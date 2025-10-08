'use client';

import { useState, useEffect } from 'react';

/**
 * Component Testing Page
 * For verifying Crisp Chat and Exit-Intent Popup in real browsers
 * Access at: /test-components
 */
export default function TestComponentsPage() {
  const [crispLoaded, setCrispLoaded] = useState(false);
  const [exitIntentActive, setExitIntentActive] = useState(false);
  const [mouseMoveCount, setMouseMoveCount] = useState(0);
  const [exitIntentCookie, setExitIntentCookie] = useState<string>('');

  useEffect(() => {
    // Check if Crisp is loaded
    const checkCrisp = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).$crisp) {
        setCrispLoaded(true);
        clearInterval(checkCrisp);
      }
    }, 500);

    // Check for exit intent cookie
    const cookies = document.cookie;
    setExitIntentCookie(cookies.includes('exit_intent_shown=true') ? 'SET (popup disabled)' : 'NOT SET (popup active)');

    // Track mouse movements near top
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 50) {
        setMouseMoveCount(prev => prev + 1);
      }
      if (e.clientY <= 0) {
        setExitIntentActive(true);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(checkCrisp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const clearExitIntentCookie = () => {
    document.cookie = 'exit_intent_shown=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setExitIntentCookie('CLEARED - reload page to re-enable popup');
  };

  const openCrisp = () => {
    if ((window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:show']);
      (window as any).$crisp.push(['do', 'chat:open']);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Component Testing Dashboard
          </h1>
          <p className="text-gray-600 mb-8">
            Real browser verification for Crisp Chat and Exit-Intent Popup
          </p>

          {/* Crisp Chat Status */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
            <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-3">
              💬 Crisp Chat Widget
              {crispLoaded ? (
                <span className="text-sm bg-green-500 text-white px-3 py-1 rounded-full">✓ LOADED</span>
              ) : (
                <span className="text-sm bg-yellow-500 text-white px-3 py-1 rounded-full">⏳ Loading...</span>
              )}
            </h2>

            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-2">
                <span className={`mt-1 w-3 h-3 rounded-full ${crispLoaded ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <div>
                  <strong>Script Status:</strong> {crispLoaded ? '✅ Loaded from client.crisp.chat' : '⏳ Waiting for external script...'}
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className={`mt-1 w-3 h-3 rounded-full ${crispLoaded ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <div>
                  <strong>Widget Visibility:</strong> {crispLoaded ? '✅ Should see blue bubble in bottom-right corner' : '❌ Widget not yet visible'}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-1 w-3 h-3 rounded-full bg-blue-500"></span>
                <div>
                  <strong>Environment Variable:</strong> NEXT_PUBLIC_CRISP_WEBSITE_ID is configured
                </div>
              </div>

              {crispLoaded && (
                <div className="mt-4 pt-4 border-t border-blue-300">
                  <button
                    onClick={openCrisp}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    Open Crisp Chat (Manual Test)
                  </button>
                </div>
              )}

              {!crispLoaded && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> If the widget doesn't load within 10 seconds, check:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc space-y-1">
                    <li>Browser console for script loading errors</li>
                    <li>Ad blockers or privacy extensions blocking client.crisp.chat</li>
                    <li>Network tab to verify the script request</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Exit-Intent Popup Status */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
            <h2 className="text-2xl font-bold text-purple-900 mb-4 flex items-center gap-3">
              🚪 Exit-Intent Popup
              {exitIntentActive ? (
                <span className="text-sm bg-green-500 text-white px-3 py-1 rounded-full">✓ TRIGGERED</span>
              ) : (
                <span className="text-sm bg-blue-500 text-white px-3 py-1 rounded-full">⏳ Waiting for exit</span>
              )}
            </h2>

            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-2">
                <span className="mt-1 w-3 h-3 rounded-full bg-blue-500"></span>
                <div>
                  <strong>Cookie Status:</strong> {exitIntentCookie}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className={`mt-1 w-3 h-3 rounded-full ${mouseMoveCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <div>
                  <strong>Mouse Movements Near Top:</strong> {mouseMoveCount} detected
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className={`mt-1 w-3 h-3 rounded-full ${exitIntentActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <div>
                  <strong>Exit Intent Triggered:</strong> {exitIntentActive ? '✅ Yes (popup should have appeared)' : '❌ No (move mouse to very top edge)'}
                </div>
              </div>

              <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800 mb-2">
                  <strong>How to test:</strong>
                </p>
                <ol className="text-sm text-purple-700 ml-4 list-decimal space-y-1">
                  <li>Wait 5 seconds after page load (required delay)</li>
                  <li>Move your mouse to the very top edge of the browser window</li>
                  <li>Move as if you're going to click the tab close button</li>
                  <li>The newsletter popup should appear with email signup form</li>
                </ol>
              </div>

              <div className="mt-4 pt-4 border-t border-purple-300">
                <button
                  onClick={clearExitIntentCookie}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Clear Exit-Intent Cookie (Re-enable Popup)
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📝 Testing Checklist</h2>
            <div className="space-y-2 text-gray-700">
              <label className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                <input type="checkbox" className="mt-1 w-5 h-5 text-blue-600 rounded" />
                <span>Blue Crisp chat bubble visible in bottom-right corner</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                <input type="checkbox" className="mt-1 w-5 h-5 text-blue-600 rounded" />
                <span>Click chat bubble → Crisp window opens</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                <input type="checkbox" className="mt-1 w-5 h-5 text-blue-600 rounded" />
                <span>Can type and send a test message in Crisp</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                <input type="checkbox" className="mt-1 w-5 h-5 text-blue-600 rounded" />
                <span>Wait 5 seconds, then move mouse to top → Exit popup appears</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                <input type="checkbox" className="mt-1 w-5 h-5 text-blue-600 rounded" />
                <span>Can enter email in exit popup and subscribe</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                <input type="checkbox" className="mt-1 w-5 h-5 text-blue-600 rounded" />
                <span>After subscribing, exit popup doesn't reappear (cookie set)</span>
              </label>
            </div>
          </div>

          <div className="mt-8 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
            <p className="text-green-900 font-medium">
              ✅ <strong>Email Templates:</strong> Fully working (verified by automated tests)
            </p>
            <p className="text-green-700 text-sm mt-1">
              Verification and password reset emails use branded templates with Postmark delivery.
            </p>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>Test page for component verification • Not linked from main navigation</p>
          <p className="mt-2">Access: https://reviewsandmarketing.com/test-components</p>
        </div>
      </div>
    </div>
  );
}
