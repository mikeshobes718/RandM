"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  // Account form fields
  const [userName, setUserName] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Fetch entitlements
        try {
          const ent = await fetch('/api/entitlements', { cache: 'no-store' });
          if (ent.ok) { const ej = await ent.json(); setPro(Boolean(ej?.pro)); }
        } catch {}

        // Fetch user info
        try {
          const userRes = await fetch('/api/auth/me', { headers: bearer() });
          if (userRes.ok) {
            const userData = await userRes.json();
            setEmail(userData.email || '');
            setUserName(userData.displayName || '');
          }
        } catch {}

        // Fetch business info
        const biz = await fetch('/api/businesses/me', { headers: bearer() });
        const j = await biz.json();
        const bizData = j?.business;
        const id = bizData?.id || '';
        setBusinessId(id);
        setBusiness(bizData);
        if (bizData) {
          setBusinessName(bizData.name || '');
          setContactPhone(bizData.contact_phone || '');
          setReviewLink(bizData.review_link || '');
        }

        // Fetch members if business exists
        if (id) {
          const r = await fetch(`/api/members/list?businessId=${id}`, { cache: 'no-store', headers: bearer() });
          const data = await r.json();
          setMembers(data.members || []);
          setInvites(data.invites || []);
          setCanManage(Boolean(data.canManage));
          setRole(data.role || '');
        }
      } catch (e) {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function bearer(): HeadersInit {
    const t = typeof window !== 'undefined' ? localStorage.getItem('idToken') : null;
    return t ? ({ Authorization: `Bearer ${t}` } as Record<string,string>) : {};
  }

  async function saveBusinessSettings() {
    if (!businessId) return;
    setSavingBusiness(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/businesses/upsert', {
        method: 'POST',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: businessId,
          name: businessName,
          contact_phone: contactPhone,
          review_link: reviewLink,
        }),
      });
      if (response.ok) {
        setSuccess('Business settings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to save business settings');
      }
    } catch (e) {
      setError('Failed to save business settings');
    } finally {
      setSavingBusiness(false);
    }
  }

  async function invite() {
    if (!businessId || !inviteEmail) return;
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/members/invite', {
        method: 'POST',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, email: inviteEmail, role: 'member' })
      });
      if (response.ok) {
        setInviteEmail('');
        setSuccess('Invitation sent successfully!');
        setTimeout(() => setSuccess(null), 3000);
        // Refresh members list
        const r = await fetch(`/api/members/list?businessId=${businessId}`, { headers: bearer() });
        const data = await r.json();
        setInvites(data.invites||[]);
        setMembers(data.members||[]);
      } else {
        setError('Failed to send invitation');
      }
    } catch (e) {
      setError('Failed to send invitation');
    }
  }

  async function remove(uid: string) {
    if (!businessId) return;
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
    } catch (e) {
      setError('Failed to remove member');
    }
  }

  async function openBillingPortal() {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { ...bearer(), 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      }
    } catch (e) {
      setError('Failed to open billing portal');
    }
  }

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Settings</h1>
            <p className="mt-1 text-slate-600">Manage your account and business preferences</p>
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
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-white rounded-t-2xl">
          <nav className="flex gap-1 px-2 pt-2" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-medium transition ${
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-slate-500">Email cannot be changed. Contact support if you need to update it.</p>
                  </div>

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
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Business Name</label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                        placeholder="Your Business Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
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
                        disabled={savingBusiness}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
                    <p className="text-slate-700 mb-4">Team management is available on the Pro plan.</p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition"
                    >
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
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-slate-900">Current Plan</div>
                        <div className="text-2xl font-bold text-indigo-600 mt-1">
                          {pro ? 'Pro' : 'Starter'}
                        </div>
                      </div>
                      {!pro && (
                        <Link
                          href="/pricing"
                          className="rounded-xl px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition"
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
                        className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 transition"
                      >
                        <div>
                          <div className="font-medium text-slate-900">Manage Subscription</div>
                          <div className="text-sm text-slate-600">Update payment method, view invoices, and more</div>
                        </div>
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Danger Zone */}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-700 mb-4">
            These actions are permanent and cannot be undone.
          </p>
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to sign out?')) {
                await fetch('/api/auth/logout', { method: 'POST' });
                localStorage.removeItem('idToken');
                router.push('/login');
              }
            }}
            className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}