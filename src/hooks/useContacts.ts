"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebaseClient';
import { AsYouType, CountryCode } from 'libphonenumber-js';

const LIST_FETCH_MS = 30000;

export type Contact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  created_at: string;
};

export function formatPhoneDisplay(phone: string): string {
  if (!phone) return phone;
  try {
    const formatter = new AsYouType('US' as CountryCode);
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return formatter.input(digits);
    if (digits.length === 11 && digits.startsWith('1')) return formatter.input(digits.slice(1));
    return phone;
  } catch {
    return phone;
  }
}

export function useContacts() {
  const [user, setUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchContactsRef = useRef<(u?: User | null) => Promise<void>>(async () => {});
  const fetchGenRef = useRef(0);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        void fetchContactsRef.current(firebaseUser);
      } else {
        fetchGenRef.current += 1;
        setContacts([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchOwnerEmail = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/dashboard/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOwnerEmail(data.ownerEmail);
        }
      } catch (e) {
        console.error('Failed to fetch owner email', e);
      }
    };
    if (user) fetchOwnerEmail();
  }, [user]);

  const fetchContacts = useCallback(async (currentUser?: User | null) => {
    const authUser = currentUser || user;
    if (!authUser) {
      fetchGenRef.current += 1;
      setLoading(false);
      return;
    }

    const gen = ++fetchGenRef.current;
    setLoading(true);
    setError(null);
    try {
      const token = await authUser.getIdToken();
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), LIST_FETCH_MS);
      const res = await fetch('/api/contacts/list', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(t);
      if (gen !== fetchGenRef.current) return;
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch contacts');
      }
      const data = await res.json();
      if (gen !== fetchGenRef.current) return;
      setContacts(data.contacts || []);
    } catch (err: unknown) {
      if (gen !== fetchGenRef.current) return;
      const aborted = err instanceof Error && err.name === 'AbortError';
      const message = aborted
        ? 'Contacts request timed out. Check your connection and tap Refresh.'
        : err instanceof Error
          ? err.message
          : 'Unknown error';
      if (!message.includes('no contacts') && !message.includes('does not exist')) {
        setError(message);
      }
    } finally {
      if (gen === fetchGenRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  fetchContactsRef.current = fetchContacts;

  const filteredContacts = contacts.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query)
    );
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
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

      if (lines.length < 2) throw new Error('CSV file must have a header row and at least one data row');

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const phoneIdx = headers.findIndex(h => h.includes('phone'));

      if (nameIdx === -1 && emailIdx === -1) throw new Error('CSV must have at least a "name" or "email" column');

      const newContacts: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const contact: Record<string, string> = { source: 'csv_upload' };
        if (nameIdx !== -1 && values[nameIdx]) contact.name = values[nameIdx];
        if (emailIdx !== -1 && values[emailIdx]) contact.email = values[emailIdx];
        if (phoneIdx !== -1 && values[phoneIdx]) contact.phone = values[phoneIdx];
        if (contact.name || contact.email) newContacts.push(contact);
      }

      if (newContacts.length === 0) throw new Error('No valid contacts found in CSV');

      const token = await user.getIdToken();
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contacts: newContacts })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to import contacts');
      }

      const result = await res.json();
      setSuccessMsg(`Successfully imported ${result.imported || newContacts.length} contacts!`);
      fetchContacts(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualAdd = async (contact: { name: string; email: string; phone: string; country: string }) => {
    if (!user || (!contact.email && !contact.phone)) return;

    setError(null);
    setSuccessMsg(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contacts: [{ ...contact, source: 'manual' }] })
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
      fetchContacts(user);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Add failed');
      return false;
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contactIds: all ? [] : Array.from(selectedIds), all })
      });
      if (!res.ok) throw new Error('Failed to delete contacts');
      setSuccessMsg(all ? 'All contacts deleted' : `${selectedIds.size} contacts deleted`);
      setSelectedIds(new Set());
      fetchContacts(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleSendOutreach = async (type: 'email' | 'sms', subject: string, message: string) => {
    if (!user || selectedIds.size === 0) return false;

    setError(null);
    setSuccessMsg(null);

    const selectedContacts = contacts.filter(c => selectedIds.has(c.id));
    const recipients = selectedContacts
      .map(c => type === 'email' ? c.email : c.phone)
      .filter(Boolean) as string[];

    if (recipients.length === 0) {
      setError(`None of the selected contacts have a valid ${type === 'email' ? 'email address' : 'phone number'}.`);
      return false;
    }

    try {
      const token = await user.getIdToken();
      const endpoint = type === 'email' ? '/api/campaigns/send-email' : '/api/campaigns/send-sms';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipients, subject, message, contactIds: Array.from(selectedIds) })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to send ${type.toUpperCase()}`);
      }

      const data = (await res.json().catch(() => ({}))) as {
        recipients?: { twilioStatus?: string | null }[];
      };

      if (type === 'sms') {
        const n = recipients.length;
        const queued = data.recipients?.some(
          (r) => (r.twilioStatus || '').toLowerCase() === 'queued' || (r.twilioStatus || '').toLowerCase() === 'accepted'
        );
        setSuccessMsg(
          queued
            ? `Twilio accepted SMS to ${n} contact${n > 1 ? 's' : ''} (queued). Delivery is not instant — check the phone in a few minutes. If nothing arrives, open Twilio → Monitor → Logs → Messaging and look for errors (US numbers often need A2P 10DLC registration).`
            : `Twilio accepted SMS to ${n} contact${n > 1 ? 's' : ''}. If the message does not show up, check Twilio Messaging logs for delivery status.`
        );
      } else {
        setSuccessMsg(`Successfully sent ${type.toUpperCase()} outreach to ${recipients.length} contact${recipients.length > 1 ? 's' : ''}!`);
      }
      setSelectedIds(new Set());
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Send failed');
      return false;
    }
  };

  const viewHistory = async (contact: Contact) => {
    if (!user) return [];
    if (!contact.email && !contact.phone) return [];

    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      if (contact.email) params.append('email', contact.email);
      if (contact.phone) params.append('phone', contact.phone);

      const res = await fetch(`/api/contacts/messages?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.messages || [];
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
    return [];
  };

  const downloadCSV = (isTemplate = false) => {
    if (!isTemplate && contacts.length === 0) {
      setError('No contacts to download');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Source', 'Added'];
    const rows = isTemplate ? [] : contacts.map(c => [
      c.name || '', c.email || '', c.phone || '', c.source || '',
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

  return {
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
  };
}
