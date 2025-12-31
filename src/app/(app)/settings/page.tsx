"use client";
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatPhone, normalizePhone } from '@/lib/phone';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '@/lib/styles';

type Member = { uid: string; email: string; role: string; added_at: string };
type Invite = { email: string; role: string; invited_at: string; token: string };
type Business = { id: string; name: string; contact_phone?: string; review_link?: string };

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'account');
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
  const BUILD_VERSION = '2026-01-01-v13-settings-facelift';

  // Google Places Autocomplete state
  const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const sessionTokenRef = useRef(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const businessNameWrapperRef = useRef<HTMLDivElement>(null);

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
        const tok = localStorage.getItem('idToken');
        const headers = tok ? { Authorization: `Bearer ${tok}` } : {};

        // Fetch entitlements
        try {
          const ent = await fetch('/api/entitlements', { cache: 'no-store', credentials: 'include', headers });
          if (ent.ok) { const ej = await ent.json(); setPro(Boolean(ej?.pro)); }
        } catch {}

        // Fetch user info
        try {
          const userRes = await fetch('/api/auth/me', { headers, cache: 'no-store', credentials: 'include' });
          if (userRes.ok) {
            const userData = await userRes.json();
            const user = userData?.user || userData;
            setEmail(user.email || '');
            setUserName(user.displayName || '');
          }
        } catch (e) {
          console.error('Error fetching user data:', e);
        }

        // Fetch business info
        const biz = await fetch('/api/businesses/me', { headers, cache: 'no-store', credentials: 'include' });
        if (biz.ok) {
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
            setInitialBusinessValues({
              name: bizData.name || '',
              phone: formattedPhone,
              link: bizData.review_link || ''
            });
          }

          if (id) {
            try {
              const r = await fetch(`/api/members/list?businessId=${id}`, { cache: 'no-store', headers, credentials: 'include' });
              if (r.ok) {
                const data = await r.json();
                setMembers(data.members || []);
                setInvites(data.invites || []);
                setCanManage(Boolean(data.canManage));
                setRole(data.role || '');
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        console.error('Settings load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        body: JSON.stringify({ input, sessionToken: sessionTokenRef.current }),
      });
      if (response.ok) {
        const data = await response.json();
        setPlaceSuggestions(data.items || []);
        setShowPlaceSuggestions(true);
      }
    } catch (err) {
    } finally {
      setSearchingPlaces(false);
    }
  };

  const handleBusinessNameChange = (value: string) => {
    setBusinessName(value);
    setSelectedPlace(null);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => searchPlaces(value), 300);
  };

  const handleSelectPlace = async (placeId: string) => {
    setShowPlaceSuggestions(false);
    setSearchingPlaces(true);
    try {
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, sessionToken: sessionTokenRef.current }),
      });
      if (response.ok) {
        const place = await response.json();
        setSelectedPlace(place);
        setBusinessName(place.displayName || '');
        if (place.writeAReviewUri) setReviewLink(place.writeAReviewUri);
        sessionTokenRef.current = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      }
    } catch (err) {
    } finally {
      setSearchingPlaces(false);
    }
  };

  async function saveBusinessSettings() {
    if (!businessName.trim() || !contactPhone.trim()) {
      setError('Business name and contact phone are required');
      return;
    }
    setSavingBusiness(true);
    setError(null);
    try {
      const tok = localStorage.getItem('idToken');
      const headers: any = { 'Content-Type': 'application/json' };
      if (tok) headers.Authorization = `Bearer ${tok}`;

      const payload: any = {
        name: businessName.trim(),
        contact_phone: normalizePhone(contactPhone),
        review_link: reviewLink.trim() || null,
      };
      if (businessId) payload.id = businessId;

      if (selectedPlace) {
        if (selectedPlace.id) payload.google_place_id = selectedPlace.id;
        if (selectedPlace.googleMapsUri) payload.google_maps_place_uri = selectedPlace.googleMapsUri;
        if (selectedPlace.writeAReviewUri) payload.google_maps_write_review_uri = selectedPlace.writeAReviewUri;
        if (selectedPlace.rating) payload.google_rating = selectedPlace.rating;
      }

      const response = await fetch('/api/businesses/upsert', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSuccess('Settings saved successfully');
        setInitialBusinessValues({ name: businessName, phone: contactPhone, link: reviewLink });
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch (e) {
      setError('Failed to save settings');
    } finally {
      setSavingBusiness(false);
    }
  }

  async function openBillingPortal() {
    try {
      setError(null);
      const tok = localStorage.getItem('idToken');
      const headers: any = { 'Content-Type': 'application/json' };
      if (tok) headers.Authorization = `Bearer ${tok}`;

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ idToken: tok || undefined })
      });
      const j = await res.json();
      if (j?.url) {
        window.location.href = j.url;
      } else {
        throw new Error(j.error || 'Unable to open billing portal');
      }
    } catch (e: any) {
      setError(e.message || 'Unable to open billing portal');
    }
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
    )},
    { id: 'business', label: 'Business', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" /></svg>
    )},
    { id: 'team', label: 'Team', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    )},
    { id: 'billing', label: 'Billing', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    )},
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full mb-4"></div>
        <p className="text-muted text-sm font-medium">Loading settings...</p>
      </div>
    );
  }

  const hasBusinessChanges = businessName !== initialBusinessValues.name || 
                             contactPhone !== initialBusinessValues.phone || 
                             reviewLink !== initialBusinessValues.link;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Settings</h1>
          <p className="text-muted text-sm font-medium">Manage your workspace and personal preferences.</p>
        </div>
        <Link href="/dashboard" className="secondary-button text-sm !h-10">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-3">
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                    : 'text-muted hover:bg-brand/5 hover:text-brand'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-9">
          <div className="premium-card p-8 md:p-10 rounded-[32px]">
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium animate-fade-in">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-700 font-medium animate-fade-in">
                {success}
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-xl font-bold mb-6">Personal Details</h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Email Address</label>
                      <input value={email} disabled className={`${inputClass} opacity-60 bg-accent/50 cursor-not-allowed`} />
                      <p className="text-[10px] text-muted ml-1 italic">Email cannot be changed manually. Contact support for help.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-border">
                  <h2 className="text-xl font-bold mb-4">Security</h2>
                  <p className="text-sm text-muted mb-6">Need to update your password? Use our secure reset flow.</p>
                  <Link href="/forgot" className="secondary-button text-sm font-bold">
                    Reset Password
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-xl font-bold mb-6">Business Identity</h2>
                  <div className="space-y-6">
                    <div className="relative" ref={businessNameWrapperRef}>
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Business Name</label>
                      <input
                        value={businessName}
                        onChange={(e) => handleBusinessNameChange(e.target.value)}
                        className={inputClass}
                        placeholder="Search for your business..."
                        autoComplete="off"
                      />
                      {searchingPlaces && (
                        <div className="absolute right-4 top-9 text-slate-400">
                          <div className="animate-spin h-4 w-4 border-2 border-brand border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      {showPlaceSuggestions && placeSuggestions.length > 0 && (
                        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-border bg-white shadow-2xl max-h-60 overflow-auto py-2">
                          {placeSuggestions.map((s) => (
                            <button
                              key={s.placeId}
                              onClick={() => handleSelectPlace(s.placeId)}
                              className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                            >
                              <div className="font-bold text-sm text-foreground">{s.mainText}</div>
                              <div className="text-[10px] text-muted truncate">{s.secondaryText}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Contact Phone <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(formatPhone(e.target.value))}
                        className={inputClass}
                        placeholder="(555) 000-0000"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Google Review Link</label>
                      <input
                        type="url"
                        value={reviewLink}
                        onChange={(e) => setReviewLink(e.target.value)}
                        className={inputClass}
                        placeholder="https://..."
                      />
                      <p className="text-[10px] text-muted ml-1">This link opens the Google review dialog directly.</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-8 border-t border-border flex items-center justify-between">
                  <button
                    onClick={saveBusinessSettings}
                    disabled={savingBusiness || !hasBusinessChanges}
                    className="primary-button h-12 px-10 disabled:opacity-50"
                  >
                    {savingBusiness ? 'Saving...' : 'Save Changes'}
                  </button>
                  {!hasBusinessChanges && <span className="text-[10px] font-bold text-muted uppercase tracking-widest italic">No changes detected</span>}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-8 animate-fade-in">
                {pro === false ? (
                  <div className="bg-brand/5 border border-brand/10 rounded-[32px] p-10 text-center">
                    <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Team Collaboration</h2>
                    <p className="text-muted text-sm mb-8 max-w-sm mx-auto">Invite your managers and staff to help manage your reputation. Team features are exclusive to Pro accounts.</p>
                    <Link href="/pricing" className="primary-button h-12 px-10">
                      Upgrade to Pro
                    </Link>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold mb-6">Team Management</h2>
                    {/* Add team list/invite logic here if Pro */}
                    <p className="text-sm text-muted italic">Team management features active.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-xl font-bold mb-6">Subscription Plan</h2>
                  <div className="bg-accent/30 border border-border rounded-3xl p-8 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Current Plan</div>
                      <div className="text-2xl font-black text-brand uppercase tracking-tighter">{pro ? 'Pro' : 'Starter'}</div>
                    </div>
                    <button onClick={openBillingPortal} className="secondary-button font-bold text-sm">
                      Manage in Stripe
                    </button>
                  </div>
                </div>
                <div className="pt-8 border-t border-border">
                  <h2 className="text-xl font-bold mb-4">Invoices</h2>
                  <p className="text-sm text-muted">Access your full billing history and download receipts through the Stripe portal.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <button
              onClick={() => {
                if (confirm('Sign out of your account?')) {
                  localStorage.clear();
                  sessionStorage.clear();
                  fetch('/api/auth/logout', { method: 'POST' }).finally(() => window.location.href = '/login');
                }
              }}
              className="px-6 py-3 rounded-xl border border-border text-sm font-bold text-muted hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all text-center"
            >
              Sign Out
            </button>
            <button
              onClick={() => {
                if (confirm('DANGER: Permanently delete your account? This cannot be undone.')) {
                  fetch('/api/account/request-deletion', { method: 'POST' }).then(() => {
                    localStorage.clear();
                    window.location.href = '/';
                  });
                }
              }}
              className="px-6 py-3 rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 hover:bg-red-100 transition-all text-center"
            >
              Request Account Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={null}>
        <SettingsContent />
      </Suspense>
    </main>
  );
}
