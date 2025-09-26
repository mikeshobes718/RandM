"use client";
import { useEffect } from 'react';

export default function ClientAuthSync() {
  useEffect(() => {
    async function sync() {
      try {
        const token = localStorage.getItem('idToken');
        if (!token) return;
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token, days: 7 }),
          credentials: 'include',
        });
      } catch {}
    }
    // initial
    void sync();
    // listen for broadcasted changes and storage updates
    const onChanged = () => { void sync(); };
    window.addEventListener('idtoken:changed', onChanged as EventListener);
    window.addEventListener('storage', (e: Event) => {
      const ev = e as StorageEvent;
      if (ev.key === 'idToken') void sync();
    });
    window.addEventListener('focus', onChanged);
    return () => {
      window.removeEventListener('idtoken:changed', onChanged as EventListener);
      window.removeEventListener('focus', onChanged);
    };
  }, []);

  useEffect(() => {
    const flagKey = 'chunk:reloaded';
    const triggerReload = () => {
      let alreadyReloaded = false;
      try {
        alreadyReloaded = sessionStorage.getItem(flagKey) === '1';
        if (!alreadyReloaded) sessionStorage.setItem(flagKey, '1');
      } catch {}
      if (alreadyReloaded) return;
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('bust', Date.now().toString(36));
        window.location.replace(url.toString());
      } catch {
        window.location.reload();
      }
    };

    const onScriptError = (event: ErrorEvent) => {
      const msg = event?.message || '';
      if (msg.includes('Loading chunk') || msg.includes('ChunkLoadError')) {
        triggerReload();
      }
    };

    const onRejected = (event: PromiseRejectionEvent) => {
      try {
        const reason = event?.reason;
        const text = typeof reason === 'string'
          ? reason
          : (reason?.message || reason?.toString?.() || '');
        if (text.includes('Loading chunk') || text.includes('ChunkLoadError')) {
          event.preventDefault();
          triggerReload();
        }
      } catch {}
    };

    window.addEventListener('error', onScriptError);
    window.addEventListener('unhandledrejection', onRejected);

    return () => {
      window.removeEventListener('error', onScriptError);
      window.removeEventListener('unhandledrejection', onRejected);
    };
  }, []);
  return null;
}
