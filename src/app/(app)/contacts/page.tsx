"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebaseClient';
import { AsYouType, CountryCode } from 'libphonenumber-js';

type Contact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  created_at: string;
};

export default function ContactsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualContact, setManualContact] = useState({ name: '', email: '', phone: '', country: 'US' });
  const [addingManual, setAddingManual] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<'email' | 'sms'>('email');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchContacts(firebaseUser);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchContacts = async (currentUser?: User | null) => {
    const authUser = currentUser || user;
    if (!authUser) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/contacts/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch contacts');
      }
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (err: any) {
      console.error('Contacts fetch error:', err);
      // Don't show error for empty contacts
      if (!err.message.includes('no contacts') && !err.message.includes('does not exist')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!manualContact.email && !manualContact.phone)) return;

    setAddingManual(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ contacts: [{ ...manualContact, source: 'manual' }] })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to add contact');
      }

      const result = await res.json();
      if (result.imported === 0 && result.duplicatesSkipped > 0) {
        throw new Error('This contact already exists in your list.');
      }

      setSuccessMsg('Contact added successfully!');
      setShowAddModal(false);
      setManualContact({ name: '', email: '', phone: '' });
      fetchContacts(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingManual(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have a header row and at least one data row');
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const phoneIdx = headers.findIndex(h => h.includes('phone'));

      if (nameIdx === -1 && emailIdx === -1) {
        throw new Error('CSV must have at least a "name" or "email" column');
      }

      const newContacts: Omit<Contact, 'id' | 'created_at'>[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const contact: any = { source: 'csv_upload' };
        
        if (nameIdx !== -1 && values[nameIdx]) contact.name = values[nameIdx];
        if (emailIdx !== -1 && values[emailIdx]) contact.email = values[emailIdx];
        if (phoneIdx !== -1 && values[phoneIdx]) contact.phone = values[phoneIdx];
        
        if (contact.name || contact.email) {
          newContacts.push(contact);
        }
      }

      if (newContacts.length === 0) {
        throw new Error('No valid contacts found in CSV');
      }

      // Send to API
      const token = await user.getIdToken();
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ contacts: newContacts })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to import contacts');
      }

      const result = await res.json();
      setSuccessMsg(`Successfully imported ${result.imported || newContacts.length} contacts!`);
      fetchContacts(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadCSV = (isTemplate = false) => {
    if (!isTemplate && contacts.length === 0) {
      setError('No contacts to download');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Source', 'Added'];
    const rows = isTemplate ? [] : contacts.map(c => [
      c.name || '',
      c.email || '',
      c.phone || '',
      c.source || '',
      c.created_at ? new Date(c.created_at).toLocaleDateString() : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isTemplate ? 'import_template.csv' : `contacts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
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

  const handleSendOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedIds.size === 0 || isSending) return;

    setIsSending(true);
    setError(null);
    setSuccessMsg(null);

    const selectedContacts = contacts.filter(c => selectedIds.has(c.id));
    const recipients = selectedContacts
      .map(c => contactType === 'email' ? c.email : c.phone)
      .filter(Boolean) as string[];

    if (recipients.length === 0) {
      setError(`None of the selected contacts have a valid ${contactType === 'email' ? 'email address' : 'phone number'}.`);
      setIsSending(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const endpoint = contactType === 'email' ? '/api/campaigns/send-email' : '/api/campaigns/send-sms';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          recipients,
          subject: contactSubject,
          message: contactMessage,
          contactIds: Array.from(selectedIds)
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to send ${contactType.toUpperCase()}`);
      }

      setSuccessMsg(`Successfully sent ${contactType.toUpperCase()} outreach to ${recipients.length} contact${recipients.length > 1 ? 's' : ''}!`);
      setShowContactModal(false);
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteContacts = async (all = false) => {
    if (!user) return;
    if (!all && selectedIds.size === 0) return;
    
    const confirmMsg = all 
      ? "Are you sure you want to delete ALL contacts? This cannot be undone."
      : `Are you sure you want to delete ${selectedIds.size} selected contacts?`;
    
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/contacts/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          contactIds: all ? [] : Array.from(selectedIds),
          all 
        })
      });

      if (!res.ok) throw new Error('Failed to delete contacts');

      setSuccessMsg(all ? 'All contacts deleted' : `${selectedIds.size} contacts deleted`);
      setSelectedIds(new Set());
      fetchContacts(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full mb-4"></div>
        <p className="text-muted text-sm font-medium tracking-widest uppercase">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hidden file input for CSV imports */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv" 
        className="hidden" 
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Contacts</h1>
          <p className="text-slate-500 text-sm font-medium mt-2">Manage your customer list and import data for campaigns.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="secondary-button !h-10 sm:!h-12 px-4 sm:px-6 text-[10px] font-black uppercase tracking-[0.1em] shadow-sm flex-1 sm:flex-none"
          >
            + Add
          </button>
          <button 
            onClick={() => handleDownloadCSV(false)}
            disabled={contacts.length === 0}
            className="secondary-button !h-10 sm:!h-12 px-4 sm:px-6 text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-1 sm:flex-none"
          >
            CSV
          </button>
          <button 
            onClick={triggerFileInput}
            disabled={uploading}
            className="primary-button !h-10 sm:!h-12 px-4 sm:px-8 text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-brand/20 disabled:opacity-50 transition-all hover:scale-[1.02] flex-1 sm:flex-none whitespace-nowrap"
          >
            {uploading ? '...' : 'Import'}
          </button>
        </div>
      </div>

      {/* Search and Bulk Actions */}
      {contacts.length > 0 && (
        <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
          </div>
          
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 animate-in slide-in-from-top-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full sm:w-auto mb-1 sm:mb-0">
                {selectedIds.size} Selected
              </span>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleBulkContact('email')}
                  className="h-9 sm:h-11 px-3 sm:px-6 bg-brand/5 text-brand text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand/10 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  Email
                </button>
                <button 
                  onClick={() => handleBulkContact('sms')}
                  className="h-9 sm:h-11 px-3 sm:px-6 bg-brand/5 text-brand text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand/10 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                  SMS
                </button>
                <button 
                  onClick={() => handleDeleteContacts(false)}
                  disabled={deleting}
                  className="h-9 sm:h-11 px-3 sm:px-6 bg-red-50 text-red-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
                >
                  {deleting ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
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

      <div className="bg-white rounded-[32px] sm:rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[500px] flex flex-col">
        {contacts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 sm:p-20 text-center">
            <div className="w-20 h-20 sm:w-24 h-24 bg-slate-50 rounded-[32px] sm:rounded-[40px] flex items-center justify-center text-4xl sm:text-5xl mx-auto mb-6 sm:mb-8 border border-slate-100 shadow-inner">
              👥
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">No contacts yet</h3>
            <p className="text-sm sm:text-base text-slate-400 font-medium max-w-md mx-auto mt-3 leading-relaxed">
              Build your audience. Import your customer list from a CSV file or connect your Square account to start sending smart review requests.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
              <button 
                onClick={triggerFileInput}
                disabled={uploading}
                className="h-12 sm:h-14 px-8 sm:px-10 bg-slate-900 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-[16px] sm:rounded-[20px] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-slate-300 disabled:opacity-50"
              >
                {uploading ? '...' : 'Upload CSV'}
              </button>
              <Link href="/integrations/square" className="h-12 sm:h-14 px-8 sm:px-10 border-2 border-slate-100 text-slate-400 text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-[16px] sm:rounded-[20px] hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center">
                Connect Square
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                <p className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest">{filteredContacts.length} Contacts</p>
                {searchQuery && <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">(Filtered)</span>}
              </div>
              <button 
                onClick={() => fetchContacts(user)}
                className="text-[9px] sm:text-[10px] font-black text-brand hover:text-brand-dark uppercase tracking-widest bg-brand/5 px-3 sm:px-4 py-2 rounded-xl transition-colors"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-[800px]">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                  <tr className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-400">
                    <th className="px-4 sm:px-6 py-4 sm:py-6 w-10">
                      <input 
                        type="checkbox" 
                        checked={filteredContacts.length > 0 && selectedIds.size === filteredContacts.length}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded border-slate-200 text-brand focus:ring-brand"
                      />
                    </th>
                    <th className="px-2 sm:px-4 py-4 sm:py-6">Name</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-6">Contact Info</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-6 hidden sm:table-cell">Source</th>
                    <th className="px-4 sm:px-6 py-4 sm:py-6">Actions</th>
                    <th className="px-6 sm:px-10 py-4 sm:py-6 text-right">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 sm:px-6 py-4 sm:py-6">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(contact.id)}
                          onChange={() => handleToggleSelect(contact.id)}
                          className="w-4 h-4 rounded border-slate-200 text-brand focus:ring-brand"
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-4 sm:py-6">
                        <p className="font-black text-slate-900 group-hover:text-brand transition-colors text-sm sm:text-base">{contact.name || 'Unnamed'}</p>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-6">
                        <div className="flex flex-col gap-0.5 sm:gap-1">
                          {contact.email && <p className="text-[11px] sm:text-xs font-bold text-slate-600 truncate max-w-[120px] sm:max-w-none">{contact.email}</p>}
                          {contact.phone && <p className="text-[9px] sm:text-[10px] font-medium text-slate-400">{contact.phone}</p>}
                          {!contact.email && !contact.phone && <span className="text-slate-300 italic text-[10px] sm:text-xs">No info</span>}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-6 hidden sm:table-cell">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-slate-200">
                          {contact.source || 'manual'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-6">
                        <div className="flex items-center gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {contact.email && (
                            <button 
                              onClick={() => handleIndividualContact(contact, 'email')}
                              className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-brand/5 text-brand flex items-center justify-center hover:bg-brand/10 transition-colors"
                              title="Email"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                            </button>
                          )}
                          {contact.phone && (
                            <button 
                              onClick={() => handleIndividualContact(contact, 'sms')}
                              className="w-7 h-7 sm:w-8 h-8 rounded-lg bg-brand/5 text-brand flex items-center justify-center hover:bg-brand/10 transition-colors"
                              title="SMS"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 sm:px-10 py-4 sm:py-6 text-right text-slate-400 text-[10px] sm:text-xs font-bold">
                        {contact.created_at ? new Date(contact.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-auto p-6 sm:p-10 border-t border-slate-50 bg-slate-50/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 hidden sm:inline"></span>
                <span>Formats:</span>
                <span className="bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm text-slate-600">.CSV</span>
                <span className="bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm text-slate-600">.XLSX</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-slate-200"></div>
              <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-widest text-center sm:text-left">
                Need help? <button onClick={() => setShowGuide(true)} className="text-brand font-black hover:underline">Read Guide</button>
              </p>
            </div>

            {contacts.length > 0 && (
              <button 
                onClick={() => handleDeleteContacts(true)}
                className="text-[9px] sm:text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h14"/></svg>
                Clear All Contacts
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add Contact</h3>
                <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">Manual Entry</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Full Name</label>
                <input 
                  type="text"
                  placeholder="e.g. John Smith"
                  value={manualContact.name}
                  onChange={(e) => setManualContact({ ...manualContact, name: e.target.value })}
                  className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Email Address</label>
                <input 
                  type="email"
                  placeholder="john@example.com"
                  value={manualContact.email}
                  onChange={(e) => setManualContact({ ...manualContact, email: e.target.value })}
                  className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Phone Number</label>
                <div className="flex gap-2">
                  <select 
                    value={manualContact.country}
                    onChange={(e) => {
                      const newCountry = e.target.value;
                      const formatter = new AsYouType(newCountry as CountryCode);
                      const formatted = formatter.input(manualContact.phone);
                      setManualContact({ ...manualContact, country: newCountry, phone: formatted });
                    }}
                    className="w-24 h-12 bg-slate-50 border border-slate-100 rounded-2xl px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  >
                    <option value="US">🇺🇸 +1</option>
                    <option value="CA">🇨🇦 +1</option>
                    <option value="GB">🇬🇧 +44</option>
                    <option value="AU">🇦🇺 +61</option>
                    <option value="IE">🇮🇪 +353</option>
                    <option value="NZ">🇳🇿 +64</option>
                  </select>
                  <input 
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={manualContact.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      // If deleting, don't auto-format to avoid fighting the user
                      if (val.length < manualContact.phone.length) {
                        setManualContact({ ...manualContact, phone: val });
                      } else {
                        const formatter = new AsYouType(manualContact.country as CountryCode);
                        const formatted = formatter.input(val);
                        setManualContact({ ...manualContact, phone: formatted });
                      }
                    }}
                    className="flex-1 h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium mt-2 ml-1">We'll format this automatically for SMS delivery.</p>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={addingManual || (!manualContact.email && !manualContact.phone)}
                  className="primary-button w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 disabled:opacity-50 transition-all"
                >
                  {addingManual ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outreach Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Send {contactType === 'email' ? 'Email' : 'SMS'} Outreach
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">
                  To {selectedIds.size} selected contact{selectedIds.size > 1 ? 's' : ''}
                </p>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSendOutreach} className="p-8 space-y-6">
              {contactType === 'email' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Subject Line</label>
                  <input 
                    type="text"
                    placeholder="e.g. A quick question about your visit"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    required
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Message Content</label>
                <textarea 
                  placeholder={contactType === 'email' ? "Write your email message here..." : "Write your SMS message here..."}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                  className="w-full min-h-[160px] bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all resize-none"
                />
                <p className="text-[9px] text-slate-400 font-medium mt-2 ml-1">
                  {contactType === 'sms' ? "Keep it short for best results. Standard SMS rates apply." : "Your brand name will be included in the footer."}
                </p>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSending || !contactMessage || (contactType === 'email' && !contactSubject)}
                  className="primary-button w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                      Send {contactType.toUpperCase()} Outreach
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Import Guide</h3>
                <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">Master your contact data</p>
              </div>
              <button 
                onClick={() => setShowGuide(false)}
                className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
              {/* Step 1 */}
              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex-shrink-0 flex items-center justify-center font-black">1</div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-wide text-sm mb-2">Prepare your CSV</h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Your file must be a <span className="text-slate-900 font-bold">.CSV</span> or <span className="text-slate-900 font-bold">.XLSX</span>. 
                    The first row must contain column headers.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex-shrink-0 flex items-center justify-center font-black">2</div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 uppercase tracking-wide text-sm mb-2">Required Columns</h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium mb-4">
                    We automatically scan for these column names (case-insensitive):
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {['Name', 'Email', 'Phone'].map(header => (
                      <div key={header} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Header</p>
                        <p className="text-xs font-bold text-slate-900">{header}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 font-bold italic">* You must have at least "Name" or "Email" for the row to be valid.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex-shrink-0 flex items-center justify-center font-black">3</div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-wide text-sm mb-2">Sample Format</h4>
                  <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
                    name, email, phone<br/>
                    John Doe, john@example.com, 555-0123<br/>
                    Jane Smith, jane@example.com, 555-0124
                  </div>
                  <button 
                    onClick={() => handleDownloadCSV(true)}
                    className="mt-4 text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2 hover:underline"
                  >
                    <span>⬇</span> Download Template
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-brand/5 border border-brand/10 rounded-3xl p-6">
                <h4 className="font-black text-brand uppercase tracking-widest text-[10px] mb-3 flex items-center gap-2">
                  <span>💡</span> Pro Tip
                </h4>
                <p className="text-xs text-brand/80 font-medium leading-relaxed">
                  Export your customers from <Link href="/integrations/square" className="font-bold underline cursor-pointer">Square</Link>, <span className="font-bold underline">Shopify</span>, or <span className="font-bold underline">Clover</span> as a CSV. Our system is designed to intelligently pick up those standard headers automatically.
                </p>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowGuide(false)}
                className="h-12 px-8 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-slate-200"
              >
                Got it, let's go
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
