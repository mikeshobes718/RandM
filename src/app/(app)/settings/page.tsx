"use client";
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatPhone, normalizePhone } from '@/lib/phone';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '@/lib/styles';
import InfoTip from '@/components/InfoTip';

type Member = { uid: string; email: string; role: string; added_at: string };
type Invite = { email: string; role: string; invited_at: string; token: string };
type Business = { id: string; name: string; contact_phone?: string; review_link?: string; google_rating?: number | null; google_photo_url?: string | null };

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'account');
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [role, setRole] = useState<string>('');
  
  // Team Management functions
  async function inviteMember() {
    if (!inviteEmail.trim() || !businessId) return;
    setLoading(true);
    try {
      const tok = localStorage.getItem('idToken');
      const res = await fetch('/api/members/invite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}`
        },
        body: JSON.stringify({ businessId, email: inviteEmail.trim(), role: 'member' })
      });
      if (res.ok) {
        setSuccess('Invite sent successfully');
        setInviteEmail('');
        // Refresh lists
        const listRes = await fetch(`/api/members/list?businessId=${businessId}`, {
          headers: { 'Authorization': `Bearer ${tok}` }
        });
        if (listRes.ok) {
          const data = await listRes.json();
          setMembers(data.members || []);
          setInvites(data.invites || []);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send invite');
      }
    } catch (e) {
      setError('An error occurred while sending invite');
    } finally {
      setLoading(false);
      setTimeout(() => { setSuccess(null); setError(null); }, 3000);
    }
  }

  async function removeMember(uid: string) {
    if (!businessId || !confirm('Are you sure you want to remove this member?')) return;
    try {
      const tok = localStorage.getItem('idToken');
      const res = await fetch('/api/members/remove', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}`
        },
        body: JSON.stringify({ businessId, uid })
      });
      if (res.ok) {
        setMembers(members.filter(m => m.uid !== uid));
        setSuccess('Member removed');
      }
    } catch (e) {}
    setTimeout(() => setSuccess(null), 3000);
  }

  async function cancelInvite(token: string) {
    if (!confirm('Cancel this invitation?')) return;
    try {
      const tok = localStorage.getItem('idToken');
      const res = await fetch('/api/members/cancel-invite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tok}`
        },
        body: JSON.stringify({ token })
      });
      if (res.ok) {
        setInvites(invites.filter(i => i.token !== token));
        setSuccess('Invite cancelled');
      }
    } catch (e) {}
    setTimeout(() => setSuccess(null), 3000);
  }
  const [email, setEmail] = useState('');
  /** Stored Reply-To override; empty string = use sign-in email */
  const [replyToDraft, setReplyToDraft] = useState('');
  const [savingReplyTo, setSavingReplyTo] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  /** Friendly billing hint (e.g. no Stripe customer yet) — not a hard error */
  const [billingPortalNotice, setBillingPortalNotice] = useState<{
    message: string;
    actionHref?: string;
    actionLabel?: string;
  } | null>(null);
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
  const BUILD_VERSION = '2026-03-29-v14-reply-to-email';

  async function saveReplyTo() {
    const tok = localStorage.getItem('idToken');
    if (!tok) {
      setError('Not signed in');
      return;
    }
    setSavingReplyTo(true);
    setError(null);
    try {
      const res = await fetch('/api/account/reply-to', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok}`,
        },
        body: JSON.stringify({
          replyToEmail: replyToDraft.trim() === '' ? null : replyToDraft.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not save reply address');
        return;
      }
      if (typeof data.replyToEmail === 'string' && data.replyToEmail.trim()) {
        setReplyToDraft(data.replyToEmail.trim());
      } else {
        setReplyToDraft('');
      }
      setSuccess('Reply address saved');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Could not save reply address');
    } finally {
      setSavingReplyTo(false);
    }
  }

  // Google Places Autocomplete state
  const [placeSuggestions, setPlaceSuggestions] = useState<any[]>([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const sessionTokenRef = useRef(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const businessNameWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = searchParams?.get('accept');
    if (token) {
      const handleAccept = async () => {
        try {
          const res = await fetch('/api/members/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          if (res.ok) {
            setSuccess('Invitation accepted! You now have access.');
            window.history.replaceState({}, '', '/settings');
            // Refresh settings data
            window.location.reload();
          } else {
            const data = await res.json();
            setError(data.error || 'Failed to accept invitation');
          }
        } catch (e) {
          setError('An error occurred while accepting invitation');
        }
      };
      handleAccept();
    }
  }, [searchParams]);

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
    if (activeTab !== 'billing') setBillingPortalNotice(null);
  }, [activeTab]);

  useEffect(() => {
    (async () => {
      try {
        const tok = localStorage.getItem('idToken');
        const headers: Record<string, string> = tok ? { Authorization: `Bearer ${tok}` } : {};

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
            const raw = user.replyToEmail;
            setReplyToDraft(typeof raw === 'string' && raw.trim() ? raw.trim() : '');
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
      const response = await fetch(`/api/places/details?placeId=${encodeURIComponent(placeId)}&sessionToken=${encodeURIComponent(sessionTokenRef.current)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const place = await response.json();
        setSelectedPlace(place);
        setBusinessName(place.displayName || '');
        if (place.writeAReviewUri) {
          setReviewLink(place.writeAReviewUri);
        }
        sessionTokenRef.current = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      } else {
        console.error('Failed to fetch place details:', response.status);
      }
    } catch (err) {
      console.error('Error in handleSelectPlace:', err);
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

      const payload: Record<string, unknown> = {
        name: businessName.trim(),
        contact_phone: normalizePhone(contactPhone),
        review_link: (reviewLink || '').trim() || null,
      };
      if (businessId) payload.id = businessId;

      if (selectedPlace) {
        if (selectedPlace.id) payload.google_place_id = selectedPlace.id;
        if (selectedPlace.googleMapsUri) payload.google_maps_place_uri = selectedPlace.googleMapsUri;
        if (selectedPlace.writeAReviewUri) payload.google_maps_write_review_uri = selectedPlace.writeAReviewUri;
        if (selectedPlace.rating) payload.google_rating = selectedPlace.rating;
        payload.google_photo_url = selectedPlace.photoUrl ?? null;
      } else if (
        businessName.trim() !== initialBusinessValues.name.trim() ||
        (reviewLink || '').trim() !== (initialBusinessValues.link || '').trim()
      ) {
        // Identity fields edited without picking a new listing — drop stale Google storefront image
        payload.google_photo_url = null;
      }

      const response = await fetch('/api/businesses/upsert', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.business) {
          try {
            const prev = JSON.parse(localStorage.getItem('businessData') || '{}');
            localStorage.setItem(
              'businessData',
              JSON.stringify({ ...prev, ...data.business })
            );
          } catch {
            localStorage.setItem('businessData', JSON.stringify(data.business));
          }
          window.dispatchEvent(new CustomEvent('businessProfileUpdated'));
        }
        setSuccess('Settings saved successfully');
        setInitialBusinessValues({ 
          name: businessName.trim(), 
          phone: contactPhone, 
          link: (reviewLink || '').trim() 
        });
        setSelectedPlace(null); // Clear selected place since it's now saved
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Failed to save settings');
      }
    } catch (e) {
      setError('Failed to save settings');
    } finally {
      setSavingBusiness(false);
    }
  }

  async function clearStorefrontPhoto() {
    if (!businessName.trim() || !contactPhone.trim()) {
      setError('Business name and contact phone are required');
      return;
    }
    setSavingBusiness(true);
    setError(null);
    try {
      const tok = localStorage.getItem('idToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tok) headers.Authorization = `Bearer ${tok}`;
      const response = await fetch('/api/businesses/upsert', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: businessName.trim(),
          contact_phone: normalizePhone(contactPhone),
          review_link: (reviewLink || '').trim() || null,
          google_photo_url: null,
        }),
      });
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.business) {
          try {
            const prev = JSON.parse(localStorage.getItem('businessData') || '{}');
            localStorage.setItem('businessData', JSON.stringify({ ...prev, ...data.business }));
          } catch {
            localStorage.setItem('businessData', JSON.stringify(data.business));
          }
          window.dispatchEvent(new CustomEvent('businessProfileUpdated'));
        }
        setBusiness((b) => (b ? { ...b, google_photo_url: null } : null));
        setSuccess('Storefront photo removed');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || 'Failed to update');
      }
    } catch {
      setError('Failed to update');
    } finally {
      setSavingBusiness(false);
    }
  }

  async function openBillingPortal() {
    try {
      setError(null);
      setBillingPortalNotice(null);
      const tok = localStorage.getItem('idToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tok) headers.Authorization = `Bearer ${tok}`;

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ idToken: tok || undefined }),
      });
      const raw = await res.text();
      let j: {
        url?: string;
        error?: string;
        code?: string;
        message?: string;
        actionHref?: string;
        actionLabel?: string;
      } = {};
      try {
        j = raw ? (JSON.parse(raw) as typeof j) : {};
      } catch {
        throw new Error(raw?.slice(0, 200) || `Billing portal failed (${res.status})`);
      }
      if (!res.ok) {
        if (res.status === 404 && j.code === 'no_stripe_customer' && j.message) {
          setBillingPortalNotice({
            message: j.message,
            actionHref: j.actionHref || '/pricing',
            actionLabel: j.actionLabel || 'View plans & pricing',
          });
          return;
        }
        throw new Error(j.error || j.message || `Billing portal failed (${res.status})`);
      }
      if (j?.url) {
        window.location.href = j.url;
      } else {
        throw new Error(j.error || 'Unable to open billing portal');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to open billing portal');
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

  const hasBusinessChanges = businessName.trim() !== initialBusinessValues.name.trim() || 
                             normalizePhone(contactPhone) !== normalizePhone(initialBusinessValues.phone) || 
                             (reviewLink || '').trim() !== (initialBusinessValues.link || '').trim() ||
                             selectedPlace !== null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight">Settings</h1>
            <InfoTip text="Account email, business profile, Google review link, team members, and billing. Changes here apply across the app." />
          </div>
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
          <div className="surface-card p-8 md:p-10 rounded-[32px]">
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium animate-fade-in">
                {error}
              </div>
            )}
            {billingPortalNotice && (
              <div className="mb-8 p-4 bg-brand/5 border border-brand/15 rounded-2xl text-sm text-on-surface animate-fade-in">
                <p className="font-medium leading-relaxed">{billingPortalNotice.message}</p>
                {billingPortalNotice.actionHref && (
                  <Link
                    href={billingPortalNotice.actionHref}
                    className="mt-3 inline-flex items-center font-bold text-brand hover:underline underline-offset-4"
                  >
                    {billingPortalNotice.actionLabel || 'Learn more'}
                  </Link>
                )}
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
                      <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Sign-in email</label>
                      <input value={email} disabled className={`${inputClass} opacity-60 bg-accent/50 cursor-not-allowed`} />
                      <p className="text-[10px] text-muted ml-1 italic">Used to log in and reset your password. To change it, contact support.</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 ml-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Customer replies (Reply-To)</label>
                        <InfoTip text="When customers hit Reply on your review or outreach emails, their message goes to this address. Leave blank to use your sign-in email." />
                      </div>
                      <input
                        type="email"
                        value={replyToDraft}
                        onChange={(e) => setReplyToDraft(e.target.value)}
                        className={inputClass}
                        placeholder={email ? `Default: ${email}` : 'same as sign-in email'}
                        autoComplete="email"
                      />
                      <p className="text-[10px] text-muted ml-1">
                        {replyToDraft.trim() === ''
                          ? `Replies will go to your sign-in address (${email || '—'}) unless you set a different one.`
                          : 'Replies will go to the address above.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => void saveReplyTo()}
                        disabled={savingReplyTo}
                        className={`${primaryButtonClass} mt-2 !h-11 px-6 text-xs font-bold`}
                      >
                        {savingReplyTo ? 'Saving…' : 'Save reply address'}
                      </button>
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
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Business Name</label>
                        {business?.google_rating != null && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.08 3.33a1 1 0 00.96.7h3.4c.96 0 1.36 1.23.58 1.79l-2.75 1.99a1 1 0 00-.36 1.11l1.08 3.33c.3.92-.76 1.68-1.54 1.11l-2.75-1.99a1 1 0 00-1.18 0l-2.75 1.99c-.78.57-1.84-.19-1.54-1.11l1.08-3.33a1 1 0 00-.36-1.11L2.99 8.78c-.78-.56-.38-1.79.58-1.79h3.4a1 1 0 00.96-.7l1.08-3.33z" />
                            </svg>
                            {business.google_rating} Rating
                          </div>
                        )}
                      </div>
                      <input
                        value={businessName}
                        onChange={(e) => handleBusinessNameChange(e.target.value)}
                        className={inputClass}
                        placeholder="Search for your business..."
                        autoComplete="off"
                      />
                      {searchingPlaces && (
                        <div className="absolute right-4 top-9 text-on-surface-variant/60">
                          <div className="animate-spin h-4 w-4 border-2 border-brand border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      {showPlaceSuggestions && placeSuggestions.length > 0 && (
                        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-border bg-surface shadow-2xl max-h-60 overflow-auto py-2">
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

                    {business?.google_photo_url ? (
                      <div className="rounded-2xl border border-border bg-surface-container-lowest/80 px-4 py-3">
                        <p className="text-xs text-muted mb-2">
                          The photo in the sidebar and dashboard comes from Google. If you changed your business name but still see an old storefront, remove it here or pick your listing again from the name search above.
                        </p>
                        <button
                          type="button"
                          onClick={clearStorefrontPhoto}
                          disabled={savingBusiness}
                          className="text-xs font-bold text-brand hover:underline disabled:opacity-50"
                        >
                          Remove storefront photo
                        </button>
                      </div>
                    ) : null}
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
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-bold mb-6">Team Management</h2>
                      
                      {canManage && (
                        <div className="mb-8 p-6 bg-accent/30 rounded-2xl border border-border">
                          <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 mb-2 block">Invite Member</label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="colleague@company.com"
                              className={inputClass}
                            />
                            <button
                              onClick={inviteMember}
                              disabled={loading || !inviteEmail}
                              className="primary-button !h-11 px-6 whitespace-nowrap"
                            >
                              Send Invite
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Active Members</h3>
                          <div className="space-y-3">
                            {members.map((m) => (
                              <div key={m.uid} className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
                                <div>
                                  <div className="text-sm font-bold text-foreground">{m.email}</div>
                                  <div className="text-[10px] text-muted uppercase font-black">{m.role}</div>
                                </div>
                                {canManage && m.role !== 'owner' && (
                                  <button
                                    onClick={() => removeMember(m.uid)}
                                    className="text-[10px] font-bold text-red-500 hover:underline"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {invites.length > 0 && (
                          <div>
                            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">Pending Invites</h3>
                            <div className="space-y-3">
                              {invites.map((i) => (
                                <div key={i.token} className="flex items-center justify-between p-4 bg-accent/20 border border-dashed border-border rounded-xl">
                                  <div>
                                    <div className="text-sm font-bold text-muted">{i.email}</div>
                                    <div className="text-[10px] text-muted uppercase">Sent {new Date(i.invited_at).toLocaleDateString()}</div>
                                  </div>
                                  {canManage && (
                                    <button
                                      onClick={() => cancelInvite(i.token)}
                                      className="text-[10px] font-bold text-red-500 hover:underline"
                                    >
                                      Revoke
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
