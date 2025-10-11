"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPhone, normalizePhone } from '@/lib/phone';

type Member = { uid: string; email: string; role: string; added_at: string };
type Invite = { email: string; role: string; invited_at: string; token: string };
type Business = { id: string; name: string; contact_phone?: string; review_link?: string };

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('account');
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [role, setRole] = useState<string>('');
  const [email, setEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [business, setBusiness] = useState<Business | null>(null);
  const [pro, setPro] = useState<boolean | null>(null);
  
  // Business form fields
  const [businessName, setBusinessName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [reviewLink, setReviewLink] = useState('');
  const [savingBusiness, setSavingBusiness] = useState(false);
  
  // Track initial values to detect changes
  const [initialBusinessValues, setInitialBusinessValues] = useState({
    name: '',
    phone: '',
    link: ''
  });

  // Account form fields
  const [userName, setUserName] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const BUILD_VERSION = '2025-10-11-v8-invite-logging'; // Update this to force cache bust
  const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

  // Google Places Autocomplete state
  const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const sessionTokenRef = useRef(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const businessNameWrapperRef = useRef<HTMLDivElement>(null);

  // Close places suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (businessNameWrapperRef.current && !businessNameWrapperRef.current.contains(event.target as Node)) {
        setShowPlaceSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // Fetch entitlements
        try {
          const ent = await fetch('/api/entitlements', { cache: 'no-store', credentials: 'include' });
          if (ent.ok) { const ej = await ent.json(); setPro(Boolean(ej?.pro)); }
        } catch {}

        // Fetch user info
        try {
          const userRes = await fetch('/api/auth/me', { headers: bearer(), cache: 'no-store', credentials: 'include' });
          if (userRes.ok) {
            const userData = await userRes.json();
            console.log('User data from /api/auth/me:', userData);
            setEmail(userData.email || '');
            setUserName(userData.displayName || '');
          } else {
            console.warn('Failed to fetch user data:', userRes.status);
          }
        } catch (e) {
          console.error('Error fetching user data:', e);
        }

        // Fetch debug info
        try {
          const debugRes = await fetch('/api/debug/auth-status', { headers: bearer(), cache: 'no-store', credentials: 'include' });
          if (debugRes.ok) {
            const debugData = await debugRes.json();
            setDebugInfo(debugData);
          }
        } catch (e) {
          console.error('Error fetching debug info:', e);
        }

        // Fetch business info
        const biz = await fetch('/api/businesses/me', { headers: bearer(), cache: 'no-store', credentials: 'include' });
        if (!biz.ok) {
          console.warn('Failed to fetch business:', biz.status);
        } else {
          const j = await biz.json();
          const bizData = j?.business;
          const id = bizData?.id || '';
          setBusinessId(id);
        setBusiness(bizData);
        if (bizData) {
          const formattedPhone = formatPhone(bizData.contact_phone) || '';
          setBusinessName(bizData.name || '');
          setContactPhone(formattedPhone);
          setReviewLink(bizData.review_link || '');
          
          // Store initial values for change detection
          setInitialBusinessValues({
            name: bizData.name || '',
            phone: formattedPhone,
            link: bizData.review_link || ''
          });
        }

          // Fetch members if business exists
          if (id) {
            try {
              const r = await fetch(`/api/members/list?businessId=${id}`, { cache: 'no-store', headers: bearer(), credentials: 'include' });
              if (r.ok) {
                const data = await r.json();
                setMembers(data.members || []);
                setInvites(data.invites || []);
                setCanManage(Boolean(data.canManage));
                setRole(data.role || '');
              }
            } catch (e) {
              console.warn('Failed to fetch members:', e);
            }
          }
        }
      } catch (e) {
        console.error('Settings load error:', e);
        // Don't show error banner for auth failures - page still functions
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function bearer(): HeadersInit {
    const t = typeof window !== 'undefined' ? localStorage.getItem('idToken') : null;
    return t ? ({ Authorization: `Bearer ${t}` } as Record<string,string>) : {};
  }

  // Google Places search
  const searchPlaces = async (input: string) => {
    if (!input.trim() || input.length < 2) {
      setPlaceSuggestions([]);
      return;
    }

    setSearchingPlaces(true);
    try {
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          sessionToken: sessionTokenRef.current,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPlaceSuggestions(data.items || []);
        setShowPlaceSuggestions(true);
      }
    } catch (err) {
      console.error('Places search error:', err);
    } finally {
      setSearchingPlaces(false);
    }
  };

  const handleBusinessNameChange = (value: string) => {
    setBusinessName(value);
    setSelectedPlace(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);
  };

  const handleSelectPlace = async (placeId: string) => {
    setShowPlaceSuggestions(false);
    setSearchingPlaces(true);

    try {
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId,
          sessionToken: sessionTokenRef.current,
        }),
      });

      if (response.ok) {
        const place = await response.json();
        setSelectedPlace(place);
        setBusinessName(place.displayName || '');
        if (place.writeAReviewUri) {
          setReviewLink(place.writeAReviewUri);
        }
        
        // Generate new session token after selection
        sessionTokenRef.current = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      }
    } catch (err) {
      console.error('Place details error:', err);
    } finally {
      setSearchingPlaces(false);
    }
  };

  // Phone formatting handler
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setContactPhone(formatted);
  };

  async function saveBusinessSettings() {
    if (!businessId) return;
    setSavingBusiness(true);
    setError(null);
    try {
      const payload: any = {
        id: businessId,
        name: businessName,
        contact_phone: normalizePhone(contactPhone), // Store normalized phone
        review_link: reviewLink,
      };

      // Include Google Place data if available
      if (selectedPlace) {
        if (selectedPlace.id) payload.google_place_id = selectedPlace.id;
        if (selectedPlace.googleMapsUri) payload.google_maps_place_uri = selectedPlace.googleMapsUri;
        if (selectedPlace.writeAReviewUri) payload.google_maps_write_review_uri = selectedPlace.writeAReviewUri;
        if (selectedPlace.rating) payload.google_rating = selectedPlace.rating;
      }

      const response = await fetch('/api/businesses/upsert', {
        method: 'POST',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        console.log('✅ Business settings saved successfully');
        setSuccess('Business settings saved successfully!');
        // Scroll to top to ensure success message is visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          console.log('🔄 Clearing success message');
          setSuccess(null);
        }, 5000); // Increased from 3 to 5 seconds
      } else {
        console.error('❌ Failed to save business settings:', response.status);
        setError('Failed to save business settings');
      }
    } catch (e) {
      setError('Failed to save business settings');
    } finally {
      setSavingBusiness(false);
    }
  }

  async function invite() {
    if (!businessId) {
      alert('DEBUG: No businessId available');
      return;
    }
    const emailToInvite = (inviteEmail || '').trim().toLowerCase();
    
    // Show debug info
    alert(`DEBUG INVITE:\nRaw: "${inviteEmail}"\nProcessed: "${emailToInvite}"\nLength: ${emailToInvite.length}\nHas @: ${emailToInvite.includes('@')}`);
    
    console.log('[INVITE] Raw inviteEmail:', JSON.stringify(inviteEmail));
    console.log('[INVITE] Processed email:', JSON.stringify(emailToInvite));
    console.log('[INVITE] Email length:', emailToInvite.length);
    console.log('[INVITE] Contains @:', emailToInvite.includes('@'));
    
    // Very simple email validation - just check for @ and basic structure
    if (!emailToInvite || !emailToInvite.includes('@') || emailToInvite.length < 5) {
      console.log('[INVITE] Email validation failed:', emailToInvite);
      setError('Please enter a valid email address');
      return;
    }
    
    console.log('[INVITE] Email validation passed, proceeding with invite');
    setError(null);
    setSuccess(null);
    try {
      console.log('[INVITE] Making API call with:', { businessId, email: emailToInvite, role: 'member' });
      const response = await fetch('/api/members/invite', {
        method: 'POST',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, email: emailToInvite, role: 'member' })
      });
      console.log('[INVITE] API response status:', response.status);
      alert(`DEBUG: API response status: ${response.status}`);
      if (response.ok) {
        setInviteEmail('');
        try {
          const payload = await response.json().catch(()=>null) as { emailSent?: boolean; warning?: string } | null;
          if (payload?.emailSent === false && payload?.warning) {
            setSuccess(payload.warning);
          } else {
            setSuccess('Invitation sent! Pending invites updated.');
          }
        } catch {
          setSuccess('Invitation sent! Pending invites updated.');
        }
        setTimeout(() => setSuccess(null), 3000);
        // Refresh members/invites lists
        try {
          const r = await fetch(`/api/members/list?businessId=${businessId}`, { 
            headers: bearer(),
            credentials: 'include',
            cache: 'no-store'
          });
          alert(`DEBUG: Refresh list API status: ${r.status}`);
          if (r.ok) {
            const data = await r.json();
            alert(`DEBUG: Invites count: ${data.invites?.length || 0}, Members count: ${data.members?.length || 0}`);
            setInvites(data.invites||[]);
            setMembers(data.members||[]);
          } else {
            alert(`DEBUG: Refresh list failed: ${r.status}`);
          }
        } catch (e) {
          alert(`DEBUG: Refresh list error: ${e}`);
        }
      } else {
        const text = await response.text().catch(()=> 'Failed to send invitation');
        setError(text || 'Failed to send invitation');
      }
    } catch (e) {
      setError('Failed to send invitation');
    }
  }

  async function remove(uid: string) {
    if (!businessId) return;
    
    if (!confirm('Are you sure you want to remove this member? They will lose access to the business dashboard.')) {
      return;
    }
    
    setError(null);
    try {
      await fetch('/api/members/remove', {
        method: 'POST',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, uid })
      });
      const r = await fetch(`/api/members/list?businessId=${businessId}`, { headers: bearer() });
      const data = await r.json();
      setInvites(data.invites||[]);
      setMembers(data.members||[]);
      setSuccess('Member removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Failed to remove member');
    }
  }

  async function openBillingPortal() {
    try {
      setError(null);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('idToken') || '';
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {}
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ idToken: (typeof localStorage !== 'undefined' ? localStorage.getItem('idToken') : '') || undefined })
      });
      if (!res.ok) {
        const text = await res.text().catch(()=> '');
        throw new Error(text || 'Unable to open billing portal');
      }
      const j = await res.json();
      if (j?.url) {
        try {
          const w = window.open(j.url, '_blank', 'noopener,noreferrer');
          if (!w) window.location.href = j.url;
        } catch { window.location.href = j.url; }
        return;
      }
      throw new Error('Unable to open billing portal');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unable to open billing portal';
      if (/stripe customer not found/i.test(message)) {
        setError('Stripe customer not found. Start a Pro checkout once to initialize billing, then return here.');
      } else {
        setError(message);
      }
    } finally {
    }
  }

  async function requestAccountDeletion() {
    if (!confirm('Are you sure you want to request account deletion? This action is permanent and cannot be undone. We will email you to confirm this request.')) {
      return;
    }

    try {
      const response = await fetch('/api/account/request-deletion', {
        method: 'POST',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setSuccess('Account deletion request sent! Check your email for confirmation instructions.');
        setTimeout(() => {
          // Sign out after requesting deletion
          fetch('/api/auth/logout', { method: 'POST' });
          localStorage.removeItem('idToken');
          router.push('/');
        }, 3000);
      } else {
        setError('Failed to submit deletion request. Please contact support.');
      }
    } catch (e) {
      setError('Failed to submit deletion request. Please contact support.');
    }
  }

  // Check if business form has unsaved changes
  const hasBusinessChanges = businessName !== initialBusinessValues.name || 
                             contactPhone !== initialBusinessValues.phone || 
                             reviewLink !== initialBusinessValues.link;

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('accept');
    if (token) {
      fetch('/api/members/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      }).then(()=> window.history.replaceState({}, '', '/settings'));
    }
  }, []);

  const tabs = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'business', label: 'Business', icon: '🏢' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'billing', label: 'Billing', icon: '💳' },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-slate-600">Loading settings...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Deployment Confirmation Banner */}
        <div className="rounded-2xl border-2 border-green-500 bg-green-50 p-4 text-center">
          <p className="text-lg font-bold text-green-900">✅ DEPLOYMENT CONFIRMED: {BUILD_VERSION}</p>
          <p className="text-sm text-green-700 mt-1">Server-side logging enabled for invite debugging. Check Vercel logs.</p>
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Settings</h1>
            <p className="mt-1 text-slate-600">Manage your account and business preferences</p>
            <p className="mt-1 text-xs text-slate-400">Build: {BUILD_VERSION}</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Pro Upgrade Banner */}
        {pro === false && (
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-slate-900">Unlock team invites and advanced features</div>
                <div className="text-sm text-slate-600 mt-1">Upgrade to Pro to manage members and access premium functionality.</div>
              </div>
              <Link
                href="/pricing"
                className="rounded-xl px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition whitespace-nowrap"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status" aria-live="polite">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-white rounded-t-2xl">
          <nav className="flex gap-1 px-2 pt-2 overflow-x-auto no-scrollbar" aria-label="Tabs" style={{ WebkitOverflowScrolling: 'touch' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-indigo-700 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="rounded-b-2xl rounded-tr-2xl border border-slate-200 bg-white shadow-sm">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Account Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 cursor-not-allowed"
                      placeholder={email ? undefined : "Loading..."}
                    />
                    <p className="mt-1 text-xs text-slate-500">Email cannot be changed. Contact support if you need to update it.</p>
                  </div>

                  {/* Debug info - only visible in development */}
                  {IS_DEVELOPMENT && (
                    <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-2">
                        <div className="text-amber-600 font-bold">⚠️</div>
                        <div className="flex-1">
                          <div className="font-semibold text-amber-900 mb-1">Debug Info (dev only)</div>
                          <div className="text-xs text-amber-800 space-y-1">
                            <div>Email value: {email || '(empty)'}</div>
                            <div>Has idToken: {typeof window !== 'undefined' && localStorage.getItem('idToken') ? 'Yes' : 'No'}</div>
                            {debugInfo && (
                              <>
                                <div>Auth success: {debugInfo.success ? '✓ Yes' : '✗ No'}</div>
                                <div>Auth method: {debugInfo.authMethod || 'none'}</div>
                                {debugInfo.user && <div>Debug email: {debugInfo.user.email || '(none)'}</div>}
                                {debugInfo.sessionCookieError && <div>Cookie error: {debugInfo.sessionCookieError}</div>}
                                {debugInfo.bearerTokenError && <div>Bearer error: {debugInfo.bearerTokenError}</div>}
                              </>
                            )}
                            {!debugInfo && <div>Debug info loading...</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Password</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      To change your password, you'll need to sign out and use the "Forgot Password" option on the login page.
                    </p>
                    <Link
                      href="/forgot"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                    >
                      Reset Password
                    </Link>
                  </div>

                  {/* Full Debug Info - only in development */}
                  {IS_DEVELOPMENT && debugInfo && (
                    <div className="pt-6 border-t border-slate-200">
                      <div className="rounded-xl border border-slate-300 bg-slate-100 p-4">
                        <div className="font-semibold text-slate-900 mb-2">Full Debug Output (dev only):</div>
                        <pre className="text-xs text-slate-700 overflow-auto whitespace-pre-wrap max-h-60">
                          {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Business Tab */}
          {activeTab === 'business' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Business Profile</h2>
                {!business ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-slate-600 mb-4">You haven't set up your business profile yet.</p>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition"
                    >
                      Set Up Business Profile
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative" ref={businessNameWrapperRef}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Business Name</label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => handleBusinessNameChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                        placeholder="Search for your business..."
                        autoComplete="off"
                      />
                      {searchingPlaces && (
                        <div className="absolute right-3 top-[42px] text-slate-400">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                      {showPlaceSuggestions && placeSuggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                          {placeSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.placeId}
                              type="button"
                              onClick={() => handleSelectPlace(suggestion.placeId)}
                              className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition border-b border-slate-100 last:border-b-0"
                            >
                              <div className="font-medium text-slate-900">{suggestion.mainText}</div>
                              <div className="text-sm text-slate-500">{suggestion.secondaryText}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Start typing to search Google Places, or enter manually
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Google Review Link</label>
                      <input
                        type="url"
                        value={reviewLink}
                        onChange={(e) => setReviewLink(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                        placeholder="https://..."
                      />
                      <p className="mt-1 text-xs text-slate-500">Your Google Business Profile review link</p>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={saveBusinessSettings}
                        disabled={savingBusiness || !hasBusinessChanges}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed"
                      >
                        {savingBusiness ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Save Changes
                          </>
                        )}
                      </button>
                      {!hasBusinessChanges && (
                        <p className="mt-2 text-xs text-slate-500">Make changes to enable save button</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Team Members</h2>
                {pro === false ? (
                  <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Team Management</h3>
                    <p className="text-slate-700 mb-2">Invite team members and collaborate on reviews together.</p>
                    <p className="text-sm text-slate-600 mb-6">Team invites and member management are available on the Pro plan.</p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Upgrade to Pro
                    </Link>
                  </div>
                ) : (
                  <>
                    {canManage && (
                      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Invite Team Member</label>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={e=>setInviteEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                          />
                          <button
                            onClick={invite}
                            className="rounded-xl px-6 py-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition whitespace-nowrap"
                          >
                            Send Invite
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Current Members */}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Current Members</h3>
                        <div className="space-y-2">
                          {members.map(m => (
                            <div key={m.uid} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                              <div className="flex-1">
                                <div className="font-medium text-slate-900">{m.email || m.uid}</div>
                                <div className="text-sm text-slate-500 capitalize">{m.role}</div>
                              </div>
                              {canManage && m.role !== 'owner' && (
                                <button
                                  onClick={()=>remove(m.uid)}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                          {members.length===0 && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-slate-500 text-sm">
                              No members yet.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pending Invites */}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Pending Invites</h3>
                        <div className="space-y-2">
                          {invites.map(i => (
                            <div key={i.token} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
                              <div className="flex-1">
                                <div className="font-medium text-slate-900">{i.email}</div>
                                <div className="text-sm text-slate-500 capitalize">{i.role} • Pending</div>
                              </div>
                            </div>
                          ))}
                          {invites.length===0 && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-slate-500 text-sm">
                              No pending invites.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Billing & Subscription</h2>
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">Current Plan</div>
                        <div className="text-2xl font-bold text-indigo-600 mt-1">
                          {pro ? 'Pro' : 'Starter'}
                        </div>
                      </div>
                      {!pro && (
                        <Link
                          href="/pricing"
                          className="w-full rounded-xl px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition sm:w-auto"
                        >
                          Upgrade to Pro
                        </Link>
                      )}
                    </div>
                    {pro && (
                      <p className="text-sm text-slate-600">
                        You're on the Pro plan with access to all premium features.
                      </p>
                    )}
                    {!pro && (
                      <p className="text-sm text-slate-600">
                        You're on the free Starter plan. Upgrade to Pro for unlimited features.
                      </p>
                    )}
                  </div>

                  {pro && (
                    <div className="space-y-3">
                      <button
                        onClick={openBillingPortal}
                        className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 transition group"
                        title="Opens Stripe billing portal in a new window"
                      >
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            Manage Subscription
                            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </div>
                          <div className="text-sm text-slate-600">Update payment method, view invoices • Opens external portal</div>
                        </div>
                        <svg className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-3">Billing Information</h3>
                    <p className="text-sm text-slate-600">
                      All billing is managed through Stripe. Click "Manage Subscription" to view your payment history and update billing details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="space-y-4">
          {/* Sign Out */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Session</h3>
            <p className="text-sm text-slate-600 mb-4">
              Sign out of your account on this device.
            </p>
            <button
              onClick={async () => {
                if (confirm('Sign out of your account?')) {
                  alert('DEBUG: Starting logout process...');
                  
                  // Clear client-side storage FIRST
                  try { 
                    localStorage.removeItem('idToken');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('selectedPlan');
                    alert('DEBUG: LocalStorage cleared');
                  } catch {}
                  try {
                    sessionStorage.clear();
                    alert('DEBUG: SessionStorage cleared');
                  } catch {}
                  
                  // Then call logout API
                  try { 
                    const res = await fetch('/api/auth/logout', { 
                      method: 'POST', 
                      credentials: 'include',
                      cache: 'no-store',
                      headers: { 'Cache-Control': 'no-cache' }
                    });
                    alert(`DEBUG: Logout API response: ${res.status}`);
                  } catch (e) {
                    alert(`DEBUG: Logout API error: ${e}`);
                  }
                  
                  // Wait a moment for cookies to clear
                  await new Promise(resolve => setTimeout(resolve, 100));
                  
                  // Force a hard redirect to ensure complete session cleanup
                  alert('DEBUG: About to redirect to /login');
                  window.location.replace('/login?nocache=' + Date.now());
                }
              }}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Sign Out
            </button>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              onClick={requestAccountDeletion}
              className="rounded-xl border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
            >
              Request Account Deletion
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
