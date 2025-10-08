"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check admin authorization
    (async () => {
      try {
        const me = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!me.ok) { 
          setAuthorized(false); 
          router.push('/login');
          return; 
        }
        const j = await me.json();
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        const isAuthorized = adminEmails.length === 0 || adminEmails.includes((j?.email || '').toLowerCase());
        setAuthorized(isAuthorized);
        
        if (!isAuthorized) {
          router.push('/');
        }
      } catch { 
        setAuthorized(false); 
        router.push('/login');
      }
    })();
  }, [router]);

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Forbidden</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
          </div>
          <nav className="px-4 pb-4">
            <Link 
              href="/admin" 
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md mb-1"
            >
              Overview
            </Link>
            <Link 
              href="/admin/users" 
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md mb-1"
            >
              Users
            </Link>
            <Link 
              href="/admin/subscriptions" 
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md mb-1"
            >
              Subscriptions
            </Link>
            <Link 
              href="/admin/templates" 
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md mb-1"
            >
              Templates
            </Link>
            <Link 
              href="/admin/settings" 
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md mb-1"
            >
              Settings
            </Link>
            <Link 
              href="/admin/support" 
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md mb-1"
            >
              Support
            </Link>
            <Link 
              href="/admin/logs" 
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md mb-1"
            >
              Logs
            </Link>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
