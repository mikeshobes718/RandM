"use client";
import { useEffect } from 'react';

const SESSION_SYNC_DEBOUNCE_MS = 600;
const CHUNK_RELOAD_MAX = 4;
const CHUNK_ATTEMPT_KEY = 'chunk:reload_attempts';

export default function ClientAuthSync() {
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

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

    function scheduleSync() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        void sync();
      }, SESSION_SYNC_DEBOUNCE_MS);
    }

    void sync();

    const onChanged = () => { scheduleSync(); };
    const onStorage = (e: Event) => {
      const ev = e as StorageEvent;
      if (ev.key === 'idToken') scheduleSync();
    };
    window.addEventListener('idtoken:changed', onChanged as EventListener);
    window.addEventListener('storage', onStorage);
    const onVisible = () => {
      if (document.visibilityState === 'visible') scheduleSync();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('idtoken:changed', onChanged as EventListener);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    const triggerReload = () => {
      let attempts = 0;
      try {
        attempts = parseInt(sessionStorage.getItem(CHUNK_ATTEMPT_KEY) || '0', 10) || 0;
      } catch {}
      if (attempts >= CHUNK_RELOAD_MAX) return;
      try {
        sessionStorage.setItem(CHUNK_ATTEMPT_KEY, String(attempts + 1));
      } catch {}
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
      const target = event.target as HTMLScriptElement | null;
      const src = target?.src || (event as unknown as { filename?: string }).filename || '';
      const fromNext = src.includes('/_next/static/');
      const looksChunk =
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('chunk load');
      if (looksChunk && (!src || fromNext)) {
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

    const resetChunkAttempts = () => {
      try {
        sessionStorage.removeItem(CHUNK_ATTEMPT_KEY);
      } catch {}
    };

    const onLoad = () => resetChunkAttempts();
    if (document.readyState === 'complete') {
      resetChunkAttempts();
    } else {
      window.addEventListener('load', onLoad);
    }

    window.addEventListener('error', onScriptError);
    window.addEventListener('unhandledrejection', onRejected);

    return () => {
      window.removeEventListener('error', onScriptError);
      window.removeEventListener('unhandledrejection', onRejected);
      window.removeEventListener('load', onLoad);
    };
  }, []);
  return null;
}
