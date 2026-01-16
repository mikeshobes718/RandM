"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebaseClient';

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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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

  const handleDownloadCSV = () => {
    if (contacts.length === 0) {
      setError('No contacts to download');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Source', 'Added'];
    const rows = contacts.map(c => [
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
    a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Contacts</h1>
          <p className="text-slate-500 font-medium mt-2">Manage your customer list and import data for campaigns.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadCSV}
            disabled={contacts.length === 0}
            className="secondary-button !h-12 px-6 text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Download CSV
          </button>
          <button 
            onClick={triggerFileInput}
            disabled={uploading}
            className="primary-button !h-12 px-8 text-[10px] font-black uppercase tracking-[0.1em] shadow-xl shadow-brand/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            {uploading ? 'Importing...' : 'Import Contacts'}
          </button>
        </div>
      </div>

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

      <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[500px] flex flex-col">
        {contacts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-5xl mx-auto mb-8 border border-slate-100 shadow-inner">
              👥
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No contacts yet</h3>
            <p className="text-base text-slate-400 font-medium max-w-md mx-auto mt-3 leading-relaxed">
              Build your audience. Import your customer list from a CSV file or connect your Square account to start sending smart review requests.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button 
                onClick={triggerFileInput}
                disabled={uploading}
                className="h-14 px-10 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-[20px] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-2xl shadow-slate-300 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
              <Link href="/settings/integrations" className="h-14 px-10 border-2 border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-widest rounded-[20px] hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center">
                Connect Square
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-4">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{contacts.length} Total Contacts</p>
              </div>
              <button 
                onClick={() => fetchContacts(user)}
                className="text-[10px] font-black text-brand hover:text-brand-dark uppercase tracking-widest bg-brand/5 px-4 py-2 rounded-xl transition-colors"
              >
                Refresh List
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                    <th className="px-10 py-6">Name</th>
                    <th className="px-6 py-6">Contact Info</th>
                    <th className="px-6 py-6">Source</th>
                    <th className="px-10 py-6 text-right">Date Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <p className="font-black text-slate-900 group-hover:text-brand transition-colors">{contact.name || 'Unnamed'}</p>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1">
                          {contact.email && <p className="text-xs font-bold text-slate-600">{contact.email}</p>}
                          {contact.phone && <p className="text-[10px] font-medium text-slate-400">{contact.phone}</p>}
                          {!contact.email && !contact.phone && <span className="text-slate-300 italic text-xs">No info</span>}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                          {contact.source || 'manual'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right text-slate-400 text-xs font-bold">
                        {contact.created_at ? new Date(contact.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="mt-auto p-10 border-t border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
              <span>Supported Formats:</span>
              <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-slate-600">.CSV</span>
              <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-slate-600">.XLSX</span>
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
              Need help? <Link href="/support" className="text-brand font-black hover:underline">Read the import guide</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
