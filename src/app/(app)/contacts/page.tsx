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
    <div className="space-y-10 animate-fade-in">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contacts</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your customer list for outbound campaigns.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadCSV}
            disabled={contacts.length === 0}
            className="secondary-button !h-12 px-6 text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download CSV
          </button>
          <button 
            onClick={triggerFileInput}
            disabled={uploading}
            className="primary-button !h-12 px-6 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            {uploading ? 'Importing...' : 'Import Contacts'}
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-emerald-600">✓</span>
          <p className="text-emerald-700 font-medium text-sm">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">×</button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-red-600">⚠</span>
          <p className="text-red-700 font-medium text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        {contacts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-6 border border-slate-100">
              👥
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No contacts yet</h3>
            <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto mt-2 leading-relaxed">
              Import your customer list from a CSV file or connect your Square account to start sending requests.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button 
                onClick={triggerFileInput}
                disabled={uploading}
                className="h-12 px-8 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
              <Link href="/settings/integrations" className="h-12 px-8 border-2 border-slate-100 text-slate-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center">
                Connect Square
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-600">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
              <button 
                onClick={() => fetchContacts(user)}
                className="text-xs font-bold text-brand hover:underline"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4 text-right">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{contact.name || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{contact.email || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{contact.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded">
                          {contact.source || 'manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 text-xs">
                        {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="p-8 border-t border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span>Accepted Formats:</span>
            <span className="bg-white px-2 py-1 rounded border border-slate-200">.CSV</span>
            <span className="bg-white px-2 py-1 rounded border border-slate-200">.XLSX</span>
          </div>
        </div>
      </div>
    </div>
  );
}
