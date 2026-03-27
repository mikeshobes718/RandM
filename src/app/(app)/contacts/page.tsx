"use client";

import { useState, useEffect, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { AsYouType, CountryCode } from 'libphonenumber-js';
import { useContacts, formatPhoneDisplay, type Contact } from '@/hooks/useContacts';
import InfoTip from '@/components/InfoTip';

function ContactsPageContent() {
  const searchParams = useSearchParams();
  const {
    user,
    contacts,
    filteredContacts,
    selectedIds,
    setSelectedIds,
    searchQuery,
    setSearchQuery,
    loading,
    uploading,
    deleting,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    ownerEmail,
    fileInputRef,
    fetchContacts,
    toggleSelectAll,
    toggleSelect,
    handleFileUpload,
    handleManualAdd,
    handleDeleteContacts,
    handleSendOutreach,
    viewHistory,
    downloadCSV,
  } = useContacts();

  const [showGuide, setShowGuide] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualContact, setManualContact] = useState({ name: '', email: '', phone: '', country: 'US' });
  const [addingManual, setAddingManual] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<'email' | 'sms'>('email');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');

  const [historyContact, setHistoryContact] = useState<Contact | null>(null);
  const [contactHistory, setContactHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const openHistory = async (contact: Contact) => {
    setHistoryContact(contact);
    setLoadingHistory(true);
    const messages = await viewHistory(contact);
    setContactHistory(messages);
    setLoadingHistory(false);
  };

  useEffect(() => {
    const search = searchParams?.get('search');
    if (search) setSearchQuery(search);
  }, [searchParams, setSearchQuery]);

  useEffect(() => {
    if (searchQuery && contacts.length > 0) {
      const match = contacts.find(c => c.email === searchQuery || c.phone === searchQuery);
      if (match && !historyContact) openHistory(match);
    }
  }, [searchQuery, contacts]);

  const onManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingManual(true);
    const ok = await handleManualAdd(manualContact);
    if (ok) {
      setShowAddModal(false);
      setManualContact({ name: '', email: '', phone: '', country: 'US' });
    }
    setAddingManual(false);
  };

  const handleBulkContact = (type: 'email' | 'sms') => {
    if (selectedIds.size === 0) return;
    setContactType(type);
    setContactSubject('');
    setContactMessage('');
    setShowContactModal(true);
  };

  const handleIndividualContact = (contact: Contact, type: 'email' | 'sms') => {
    setSelectedIds(new Set([contact.id]));
    setContactType(type);
    setContactSubject('');
    setContactMessage('');
    setShowContactModal(true);
  };

  const onSendOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    setIsSending(true);
    const ok = await handleSendOutreach(contactType, contactSubject, contactMessage);
    if (ok) {
      setShowContactModal(false);
      setRecipientSearch('');
    }
    setIsSending(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-on-surface-variant text-sm font-medium">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-full">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight display-font">Contacts Hub</h1>
            <InfoTip text="Your customer list for review requests and SMS/email outreach. Import CSV, add manually, or sync from campaigns." />
          </div>
          <p className="text-on-surface-variant text-sm mt-1">Manage your customer list and import data for campaigns.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button onClick={() => setShowAddModal(true)} className="secondary-button !h-10 px-4 text-[10px] font-bold uppercase tracking-widest flex-1 sm:flex-none">+ Add</button>
          <button onClick={() => downloadCSV(false)} disabled={contacts.length === 0} className="secondary-button !h-10 px-4 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none">Export</button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="primary-button !h-10 px-6 text-[10px] font-bold uppercase tracking-widest shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02] flex-1 sm:flex-none whitespace-nowrap">{uploading ? '...' : 'Import CSV'}</button>
        </div>
      </div>

      {/* Analytics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total</p>
          <p className="text-2xl font-extrabold text-primary">{contacts.length}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">With Email</p>
          <p className="text-2xl font-extrabold text-primary">{contacts.filter(c => c.email).length}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">With Phone</p>
          <p className="text-2xl font-extrabold text-primary">{contacts.filter(c => c.phone).length}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/15 shadow-sm">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Selected</p>
          <p className="text-2xl font-extrabold text-primary">{selectedIds.size}</p>
        </div>
      </div>

      {contacts.length > 0 && (
        <div className="flex flex-col gap-4 bg-surface p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-outline-variant/20 shadow-sm">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">🔍</span>
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all" />
          </div>
          {selectedIds.size > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">{selectedIds.size} Selected</span>
                <span className="text-[9px] font-medium text-on-surface-variant/60 bg-surface-container-lowest px-2 py-0.5 rounded-md border border-outline-variant/20 hidden sm:inline-block">Replies will go to: {ownerEmail || 'your email'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button onClick={() => handleBulkContact('email')} className="h-9 sm:h-11 px-3 sm:px-6 bg-brand/5 text-brand text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand/10 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  Email
                </button>
                <button disabled className="h-9 sm:h-11 px-3 sm:px-6 bg-surface-container-low text-on-surface-variant/60 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 flex-1 sm:flex-none justify-center cursor-not-allowed opacity-60" title="SMS coming soon">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                  SMS
                </button>
                <button onClick={() => handleDeleteContacts(false)} disabled={deleting} className="h-9 sm:h-11 px-3 sm:px-6 bg-red-50 text-red-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center">{deleting ? '...' : 'Delete'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-200">✓</div>
            <p className="text-emerald-800 font-bold text-sm">{successMsg}</p>
            <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-300 hover:text-emerald-500 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-5 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
            <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-red-200">!</div>
            <p className="text-red-800 font-bold text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-red-500 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {contacts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 sm:p-20 text-center">
            <div className="w-20 h-20 sm:w-24 h-24 bg-surface-container-lowest rounded-[32px] sm:rounded-[40px] flex items-center justify-center text-4xl sm:text-5xl mx-auto mb-6 sm:mb-8 border border-outline-variant/20 shadow-inner">👥</div>
            <h3 className="text-xl sm:text-2xl font-black text-on-surface uppercase tracking-tight">No contacts yet</h3>
            <p className="text-sm sm:text-base text-on-surface-variant/60 font-medium max-w-md mx-auto mt-3 leading-relaxed">Build your audience. Import your customer list from a CSV file or connect your Square account to start sending smart review requests.</p>
            <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="h-12 sm:h-14 px-8 sm:px-10 bg-inverse-surface text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-[16px] sm:rounded-[20px] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-outline-variant/20 disabled:opacity-50">{uploading ? '...' : 'Upload CSV'}</button>
              <Link href="/integrations/square" className="h-12 sm:h-14 px-8 sm:px-10 border-2 border-outline-variant/20 text-on-surface-variant/60 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-[16px] sm:rounded-[20px] hover:bg-surface-container-lowest hover:text-on-surface-variant transition-all flex items-center">Connect Square</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest/30">
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                <p className="text-xs sm:text-sm font-black text-on-surface uppercase tracking-widest">{filteredContacts.length} Contacts</p>
                {searchQuery && <span className="text-[9px] sm:text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest hidden sm:inline">(Filtered)</span>}
              </div>
              <button onClick={() => fetchContacts(user)} className="text-[9px] sm:text-[10px] font-black text-brand hover:text-brand-dark uppercase tracking-widest bg-brand/5 px-3 sm:px-4 py-2 rounded-xl transition-colors">Refresh</button>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-[800px]">
                <thead className="sticky top-0 z-10 bg-surface-container-lowest shadow-sm">
                  <tr className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-on-surface-variant/60">
                    <th className="px-4 sm:px-6 py-4 sm:py-6 w-10"><input type="checkbox" checked={filteredContacts.length > 0 && selectedIds.size === filteredContacts.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-outline-variant/30 text-brand focus:ring-brand" /></th>
                    <th className="px-2 sm:px-4 py-4 sm:py-6">Name</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-6">Contact Info</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-6 hidden sm:table-cell">Source</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-6">Actions</th>
                    <th className="px-6 sm:px-10 py-4 sm:py-6 text-right">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 bg-surface">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-surface-container-lowest/50 transition-colors group">
                      <td className="px-4 sm:px-6 py-4 sm:py-6"><input type="checkbox" checked={selectedIds.has(contact.id)} onChange={() => toggleSelect(contact.id)} className="w-4 h-4 rounded border-outline-variant/30 text-brand focus:ring-brand" /></td>
                      <td className="px-2 sm:px-4 py-4 sm:py-6"><p className="font-black text-on-surface group-hover:text-brand transition-colors text-sm sm:text-base">{contact.name || 'Unnamed'}</p></td>
                      <td className="px-4 sm:px-6 py-4 sm:py-6">
                        <div className="flex flex-col gap-0.5 sm:gap-1">
                          {contact.email && <p className="text-[11px] sm:text-xs font-bold text-on-surface-variant truncate max-w-[120px] sm:max-w-none">{contact.email}</p>}
                          {contact.phone && <p className="text-[9px] sm:text-[10px] font-medium text-on-surface-variant/60">{formatPhoneDisplay(contact.phone)}</p>}
                          {!contact.email && !contact.phone && <span className="text-on-surface-variant/40 italic text-[10px] sm:text-xs">No info</span>}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-6 hidden sm:table-cell"><span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant text-[8px] font-black uppercase tracking-widest rounded-md border border-outline-variant/30">{contact.source || 'manual'}</span></td>
                      <td className="px-4 sm:px-6 py-4 sm:py-6">
                        <div className="flex items-center gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {contact.email && (
                            <button onClick={() => handleIndividualContact(contact, 'email')} className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-brand/5 text-brand flex items-center justify-center hover:bg-brand/10 transition-colors" title="Email">
                              <svg className="w-3.5 h-3.5 sm:w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            </button>
                          )}
                          {contact.phone && (
                            <button disabled className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-surface-container-low text-on-surface-variant/60 flex items-center justify-center cursor-not-allowed opacity-60" title="SMS coming soon">
                              <svg className="w-3.5 h-3.5 sm:w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                            </button>
                          )}
                          <button onClick={() => openHistory(contact)} className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-surface-container transition-colors ml-1" title="View Message History">
                            <svg className="w-3.5 h-3.5 sm:w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 sm:px-10 py-4 sm:py-6 text-right text-on-surface-variant/60 text-[10px] sm:text-xs font-bold">{contact.created_at ? new Date(contact.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-auto p-6 sm:p-10 border-t border-outline-variant/20 bg-surface-container-lowest/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-on-surface-variant/60">
                <span className="w-1.5 h-1.5 rounded-full bg-surface-container hidden sm:inline"></span>
                <span>Formats:</span>
                <span className="bg-surface px-2 py-1 rounded-md border border-outline-variant/30 shadow-sm text-on-surface-variant">.CSV</span>
                <span className="bg-surface px-2 py-1 rounded-md border border-outline-variant/30 shadow-sm text-on-surface-variant">.XLSX</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-surface-container"></div>
              <p className="text-[9px] sm:text-[10px] font-medium text-on-surface-variant/60 uppercase tracking-widest text-center sm:text-left">Need help? <button onClick={() => setShowGuide(true)} className="text-brand font-black hover:underline">Read Guide</button></p>
            </div>
            {contacts.length > 0 && (
              <button onClick={() => handleDeleteContacts(true)} className="text-[9px] sm:text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-[0.2em] transition-colors flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14"/></svg>
                Clear All Contacts
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals portaled to document.body — avoids iOS bugs when ancestors use transform/overflow */}
      {portalReady &&
        createPortal(
          <>
            {showAddModal && (
              <div className="fixed inset-0 z-[100000] flex flex-col bg-surface md:animate-in md:fade-in md:duration-200 md:items-center md:justify-center md:bg-transparent md:p-6">
                <div
                  className="absolute inset-0 hidden bg-inverse-surface/60 backdrop-blur-sm md:block"
                  aria-hidden
                  onClick={() => setShowAddModal(false)}
                />
                <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full min-h-0 flex-col overflow-hidden bg-surface md:h-auto md:max-h-[90dvh] md:max-w-md md:flex-none md:animate-in md:zoom-in-95 md:rounded-[40px] md:duration-200 md:shadow-2xl">
                  <header className="flex shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest/50 px-4 pb-4 pt-[max(12px,env(safe-area-inset-top))] md:p-8">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-on-surface md:text-xl">Add contact</h3>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/60 md:text-xs">Manual entry</p>
                    </div>
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-surface text-on-surface-variant/60 shadow-sm transition-all hover:text-on-surface-variant min-h-[44px] min-w-[44px] md:h-10 md:w-10 md:min-h-0 md:min-w-0">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </header>
                  <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto px-4 pb-[max(20px,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch] md:px-8 md:pb-10">
                    <form onSubmit={onManualAdd} className="space-y-5 py-5 md:space-y-6 md:py-0">
                      <div>
                        <label className="mb-2 block px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Full name</label>
                        <input type="text" placeholder="e.g. John Smith" value={manualContact.name} onChange={(e) => setManualContact({ ...manualContact, name: e.target.value })} className="h-12 w-full rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 text-base font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 md:text-sm" />
                      </div>
                      <div>
                        <label className="mb-2 block px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Email</label>
                        <input type="email" placeholder="john@example.com" inputMode="email" autoComplete="email" value={manualContact.email} onChange={(e) => setManualContact({ ...manualContact, email: e.target.value })} className="h-12 w-full rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 text-base font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 md:text-sm" />
                      </div>
                      <div>
                        <label className="mb-2 block px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Phone</label>
                        <div className="flex gap-2">
                          <select value={manualContact.country} onChange={(e) => { const c = e.target.value; const f = new AsYouType(c as CountryCode); setManualContact({ ...manualContact, country: c, phone: f.input(manualContact.phone) }); }} className="h-12 w-24 shrink-0 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand/20">
                            <option value="US">🇺🇸 +1</option>
                            <option value="CA">🇨🇦 +1</option>
                            <option value="GB">🇬🇧 +44</option>
                            <option value="AU">🇦🇺 +61</option>
                            <option value="IE">🇮🇪 +353</option>
                            <option value="NZ">🇳🇿 +64</option>
                          </select>
                          <input type="tel" placeholder="(555) 000-0000" inputMode="tel" autoComplete="tel" value={manualContact.phone} onChange={(e) => { const v = e.target.value; if (v.length < manualContact.phone.length) { setManualContact({ ...manualContact, phone: v }); } else { const f = new AsYouType(manualContact.country as CountryCode); setManualContact({ ...manualContact, phone: f.input(v) }); } }} className="h-12 min-w-0 flex-1 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 text-base font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 md:text-sm" />
                        </div>
                        <p className="ml-1 mt-2 text-[9px] font-medium text-on-surface-variant/60">We format this for SMS automatically.</p>
                      </div>
                      <div className="pt-2">
                        <button type="submit" disabled={addingManual || (!manualContact.email && !manualContact.phone)} className="primary-button h-14 w-full rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 transition-all disabled:opacity-50 min-h-[48px]">{addingManual ? 'Saving...' : 'Save contact'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {showContactModal && (
              <div
                className="fixed inset-0 z-[100000] flex flex-col bg-surface md:animate-in md:fade-in md:duration-200 md:items-center md:justify-center md:bg-transparent md:p-6"
                role="dialog"
                aria-modal="true"
                aria-labelledby="outreach-modal-title"
              >
                <div
                  className="absolute inset-0 hidden bg-inverse-surface/60 backdrop-blur-sm md:block"
                  aria-hidden
                  onClick={() => { setShowContactModal(false); setRecipientSearch(''); }}
                />
                <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full min-h-0 flex-col overflow-hidden bg-surface md:h-auto md:max-h-[90dvh] md:max-w-xl md:flex-none md:animate-in md:zoom-in-95 md:rounded-[40px] md:duration-200 md:shadow-2xl">
                  <header className="flex shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest/50 px-4 pb-4 pt-[max(12px,env(safe-area-inset-top))] md:p-8">
                    <div className="min-w-0 pr-2">
                      <h3 id="outreach-modal-title" className="text-lg font-black uppercase tracking-tight text-on-surface md:text-xl">
                        Send {contactType === 'email' ? 'email' : 'SMS'} outreach
                      </h3>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/60 md:text-xs">{selectedIds.size} selected</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowContactModal(false); setRecipientSearch(''); }}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-surface text-on-surface-variant/60 shadow-sm transition-all hover:text-on-surface-variant min-h-[44px] min-w-[44px] md:h-10 md:w-10 md:min-h-0 md:min-w-0"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </header>
                  <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto px-4 pb-[max(20px,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch] md:px-8 md:pb-10">
                    <form onSubmit={onSendOutreach} className="space-y-5 py-5 md:space-y-6 md:py-0">
                      <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                            Recipients
                            {selectedIds.size > 0 && (
                              <span className="ml-2 inline rounded-md bg-brand px-1.5 py-0.5 text-[9px] text-white">{selectedIds.size}</span>
                            )}
                          </p>
                          {selectedIds.size > 0 && (
                            <button type="button" onClick={() => setSelectedIds(new Set())} className="shrink-0 text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60 transition-colors hover:text-red-400 min-h-[44px] px-1 md:min-h-0">
                              Clear all
                            </button>
                          )}
                        </div>
                        <div className="relative mb-2">
                          <svg className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                          <input
                            type="text"
                            enterKeyHint="search"
                            placeholder="Add more contacts…"
                            value={recipientSearch}
                            onChange={(e) => setRecipientSearch(e.target.value)}
                            autoCapitalize="off"
                            autoCorrect="off"
                            spellCheck={false}
                            className="h-11 w-full rounded-xl border border-outline-variant/30 bg-surface pl-9 pr-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 md:h-9 md:text-xs"
                          />
                        </div>
                        {recipientSearch.trim().length > 0 && (
                          <div className="mb-2 overflow-visible rounded-xl border border-outline-variant/30 bg-surface shadow-sm max-md:max-h-none md:max-h-40 md:overflow-y-auto">
                            {contacts.filter(c => { const q = recipientSearch.toLowerCase(); return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(q); }).slice(0, 8).map(c => (
                              <button key={c.id} type="button" onClick={() => { setSelectedIds(prev => { const n = new Set(prev); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; }); setRecipientSearch(''); }} className={`flex w-full items-center justify-between border-b border-outline-variant/20 px-3 py-3 text-left transition-colors last:border-0 hover:bg-surface-container-lowest min-h-[48px] md:py-2 md:min-h-0 ${selectedIds.has(c.id) ? 'bg-brand/5' : ''}`}>
                                <div className="min-w-0 flex flex-col">
                                  <span className="truncate text-sm font-black text-on-surface md:text-[11px]">{c.name || 'Unnamed'}</span>
                                  <span className="truncate text-xs text-on-surface-variant/60 md:text-[9px]">{c.email || formatPhoneDisplay(c.phone || '')}</span>
                                </div>
                                {selectedIds.has(c.id) && <svg className="ml-2 h-4 w-4 shrink-0 text-brand" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                              </button>
                            ))}
                            {contacts.filter(c => { const q = recipientSearch.toLowerCase(); return (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q) || (c.phone || '').includes(q); }).length === 0 && <p className="py-4 text-center text-sm text-on-surface-variant/60 md:text-[10px]">No contacts found</p>}
                          </div>
                        )}
                        {selectedIds.size > 0 ? (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {contacts.filter(c => selectedIds.has(c.id)).slice(0, 8).map(c => (
                              <span key={c.id} className="flex items-center gap-1 rounded-lg border border-outline-variant/30 bg-surface px-2 py-1.5 text-xs font-bold text-on-surface-variant md:text-[10px]">
                                <span className="max-w-[140px] truncate md:max-w-none">{c.name || c.email || c.phone}</span>
                                <button type="button" onClick={() => setSelectedIds(prev => { const n = new Set(prev); n.delete(c.id); return n; })} className="ml-0.5 text-on-surface-variant/40 transition-colors hover:text-red-400 min-h-[32px] min-w-[32px] md:min-h-0 md:min-w-0">×</button>
                              </span>
                            ))}
                            {selectedIds.size > 8 && <span className="rounded-lg border border-brand/10 bg-brand/5 px-2 py-1.5 text-xs font-black text-brand">+{selectedIds.size - 8} more</span>}
                          </div>
                        ) : (
                          <p className="py-2 text-center text-xs text-on-surface-variant/60 md:text-[10px]">Search to add recipients or select from the list below.</p>
                        )}
                      </section>
                      {contactType === 'email' && (
                        <div>
                          <label className="mb-2 block px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Subject</label>
                          <input type="text" placeholder="e.g. A quick question about your visit" value={contactSubject} onChange={(e) => setContactSubject(e.target.value)} required className="h-12 w-full rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 text-base font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 md:text-sm" />
                        </div>
                      )}
                      <div>
                        <div className="mb-2 flex flex-col gap-1 px-1 sm:flex-row sm:items-center sm:justify-between">
                          <label className="shrink-0 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Message</label>
                          {contactType === 'email' && (
                            <span className="text-xs font-medium text-on-surface-variant/60 md:max-w-[55%] md:truncate md:text-right md:text-[9px]">
                              Replies: {ownerEmail || 'your email'}
                            </span>
                          )}
                        </div>
                        <textarea
                          placeholder={contactType === 'email' ? 'Write your email…' : 'Write your SMS…'}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          required
                          autoComplete="off"
                          autoCapitalize="sentences"
                          rows={6}
                          className="min-h-[180px] w-full resize-none rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 md:min-h-[160px] md:text-sm"
                        />
                        <p className="ml-1 mt-2 text-[9px] font-medium text-on-surface-variant/60">{contactType === 'sms' ? 'Keep it short. SMS rates apply.' : 'Your brand name goes in the footer.'}</p>
                      </div>
                      <div className="pt-2">
                        <button type="submit" disabled={isSending || selectedIds.size === 0 || !contactMessage || (contactType === 'email' && !contactSubject)} className="primary-button flex min-h-[48px] h-14 w-full items-center justify-center gap-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 transition-all disabled:opacity-50">
                          {isSending ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Sending…</>) : (<><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>Send {contactType.toUpperCase()} outreach</>)}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {historyContact && (
              <div className="fixed inset-0 z-[100000] flex flex-col bg-surface md:animate-in md:fade-in md:duration-200 md:items-center md:justify-center md:bg-transparent md:p-6">
                <div
                  className="absolute inset-0 hidden bg-inverse-surface/60 backdrop-blur-sm md:block"
                  aria-hidden
                  onClick={() => setHistoryContact(null)}
                />
                <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full min-h-0 flex-col overflow-hidden bg-surface md:h-auto md:max-h-[90dvh] md:max-w-2xl md:flex-none md:animate-in md:zoom-in-95 md:rounded-[40px] md:duration-200 md:shadow-2xl">
                  <header className="flex shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest/50 px-4 pb-4 pt-[max(12px,env(safe-area-inset-top))] md:p-8">
                    <div className="min-w-0 pr-2">
                      <h3 className="text-lg font-black uppercase tracking-tight text-on-surface md:text-xl">Message history</h3>
                      <p className="mt-0.5 truncate text-[10px] font-medium text-on-surface-variant/60 md:text-xs">
                        {historyContact.name || 'Unnamed'} • {historyContact.email || formatPhoneDisplay(historyContact.phone || '')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 md:gap-3">
                      <button
                        onClick={() => { const type = historyContact.email ? 'email' : 'sms'; handleIndividualContact(historyContact, type); setHistoryContact(null); }}
                        className="flex h-11 items-center gap-2 rounded-xl bg-brand px-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-brand/20 transition-colors hover:bg-brand-dark md:h-10 md:px-4"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                        <span className="hidden sm:inline">Send</span>
                      </button>
                      <button
                        onClick={() => setHistoryContact(null)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-surface text-on-surface-variant/60 shadow-sm transition-all hover:text-on-surface-variant md:h-10 md:w-10"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </header>
                  <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto bg-surface-container-lowest/30 p-4 pb-[max(20px,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch] md:p-8">
                    {loadingHistory ? (
                      <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div></div>
                    ) : contactHistory.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-variant/20 bg-surface text-xl shadow-sm">💬</div>
                        <p className="mb-1 text-xs font-black uppercase tracking-widest text-on-surface">No messages yet</p>
                        <p className="text-[10px] font-medium text-on-surface-variant/60">You haven't sent any direct outreach to this contact.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {contactHistory.map((msg: any, i: number) => (
                          <div key={i} className="relative rounded-2xl border border-outline-variant/20 bg-surface p-4 shadow-sm md:p-5">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest ${msg.channel === 'sms' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{msg.channel}</span>
                                <span className="text-[10px] font-bold text-on-surface-variant/60">{new Date(msg.created_at).toLocaleString()}</span>
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${msg.status === 'sent' ? 'text-emerald-500' : 'text-red-500'}`}>{msg.status}</span>
                            </div>
                            <div className="whitespace-pre-wrap rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-3 text-sm font-medium text-on-surface-variant md:p-4">{msg.content}</div>
                            {msg.error_message && (
                              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-600">
                                <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest">Error</span>
                                {msg.error_message}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showGuide && (
              <div className="fixed inset-0 z-[100000] flex flex-col bg-surface md:animate-in md:fade-in md:duration-200 md:items-center md:justify-center md:bg-transparent md:p-6">
                <div
                  className="absolute inset-0 hidden bg-inverse-surface/60 backdrop-blur-sm md:block"
                  aria-hidden
                  onClick={() => setShowGuide(false)}
                />
                <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] w-full min-h-0 flex-col overflow-hidden bg-surface md:h-auto md:max-h-[90dvh] md:max-w-2xl md:flex-none md:animate-in md:zoom-in-95 md:rounded-[40px] md:duration-200 md:shadow-2xl">
                  <header className="flex shrink-0 items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest/50 px-4 pb-4 pt-[max(12px,env(safe-area-inset-top))] md:p-8">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-on-surface md:text-xl">Import guide</h3>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/60 md:text-xs">Master your contact data</p>
                    </div>
                    <button onClick={() => setShowGuide(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant/20 bg-surface text-on-surface-variant/60 shadow-sm transition-all hover:text-on-surface-variant md:h-10 md:w-10">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </header>
                  <div className="min-h-0 flex-1 touch-pan-y space-y-8 overflow-y-auto px-4 py-6 pb-[max(20px,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch] md:p-8">
                    <div className="flex gap-4 md:gap-6">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 font-black text-brand">1</div>
                      <div>
                        <h4 className="mb-2 text-sm font-black uppercase tracking-wide text-on-surface">Prepare your CSV</h4>
                        <p className="text-sm font-medium leading-relaxed text-on-surface-variant">Your file must be a <span className="font-bold text-on-surface">.CSV</span> or <span className="font-bold text-on-surface">.XLSX</span>. The first row must contain column headers.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 md:gap-6">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 font-black text-brand">2</div>
                      <div className="flex-1">
                        <h4 className="mb-2 text-sm font-black uppercase tracking-wide text-on-surface">Required Columns</h4>
                        <p className="mb-4 text-sm font-medium leading-relaxed text-on-surface-variant">We automatically scan for these column names (case-insensitive):</p>
                        <div className="grid grid-cols-3 gap-2 md:gap-3">
                          {['Name', 'Email', 'Phone'].map(header => (
                            <div key={header} className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-2 text-center md:p-3">
                              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Header</p>
                              <p className="text-xs font-bold text-on-surface">{header}</p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-4 text-[10px] font-bold italic text-on-surface-variant/60">* You must have at least "Name" or "Email" for the row to be valid.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 md:gap-6">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10 font-black text-brand">3</div>
                      <div className="min-w-0">
                        <h4 className="mb-2 text-sm font-black uppercase tracking-wide text-on-surface">Sample Format</h4>
                        <div className="overflow-x-auto rounded-2xl bg-inverse-surface p-4 font-mono text-[11px] leading-relaxed text-white/40">name, email, phone<br/>John Doe, john@example.com, 555-0123<br/>Jane Smith, jane@example.com, 555-0124</div>
                        <button onClick={() => downloadCSV(true)} className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand hover:underline"><span>⬇</span> Download Template</button>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-brand/10 bg-brand/5 p-5 md:p-6">
                      <h4 className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand"><span>💡</span> Pro Tip</h4>
                      <p className="text-xs font-medium leading-relaxed text-brand/80">Export your customers from <Link href="/integrations/square" className="cursor-pointer font-bold underline">Square</Link>, <span className="font-bold underline">Shopify</span>, or <span className="font-bold underline">Clover</span> as a CSV. Our system is designed to intelligently pick up those standard headers automatically.</p>
                    </div>
                  </div>
                  <footer className="shrink-0 border-t border-outline-variant/20 bg-surface-container-lowest p-4 pb-[max(16px,env(safe-area-inset-bottom))] md:p-8 md:pb-8">
                    <button onClick={() => setShowGuide(false)} className="flex h-12 w-full items-center justify-center rounded-2xl bg-inverse-surface px-8 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-outline-variant/20 transition-all hover:scale-[1.02] active:scale-[0.98] md:w-auto md:float-right">Got it, let's go</button>
                  </footer>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-on-surface-variant text-sm font-medium tracking-widest uppercase">Loading contacts...</p>
      </div>
    }>
      <ContactsPageContent />
    </Suspense>
  );
}
