"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminReps() {
  const router = useRouter();
  const [reps, setReps] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const idToken = localStorage.getItem('idToken');
        const [repsRes, usersRes] = await Promise.all([
          fetch('/api/admin/reps'),
          fetch('/api/admin/users/list?limit=100', {
            headers: { 'Authorization': `Bearer ${idToken}` }
          })
        ]);
        
        const repsData = await repsRes.json();
        const usersData = await usersRes.json();
        
        setReps(repsData.reps || []);
        setUsers(usersData.users || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleUpdateUser = async (uid: string, data: any) => {
    setUpdating(uid);
    try {
      const idToken = localStorage.getItem('idToken');
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ uid, ...data })
      });
      
      if (res.ok) {
        setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...data } : u));
      }
    } catch (err) {
      console.error('Failed to update user:', err);
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter !== "All") {
      if (filter === "Sales Rep" && user.role !== "sales_rep") return false;
      if (filter === "Customer" && user.role !== "customer") return false;
    }
    if (search && !user.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="p-12 text-center font-black animate-pulse text-white">LOADING DATA...</div>;

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Control</h1>
          <p className="text-slate-500 font-medium mt-1">Assign roles and static REP IDs to your team.</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex gap-2">
            {["All", "Sales Rep", "Customer"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  filter === f ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search by email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-10 pr-4 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 w-64 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50">
                <th className="px-8 py-4">Registered Email</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Static REP ID</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900">{user.email}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-5">
                    <select 
                      value={user.role || 'customer'}
                      onChange={(e) => handleUpdateUser(user.uid, { role: e.target.value })}
                      disabled={updating === user.uid}
                      className="bg-slate-50 border-none rounded-lg text-[10px] font-black uppercase tracking-widest px-3 py-1.5 focus:ring-2 focus:ring-brand/20 outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="customer">Customer</option>
                      <option value="sales_rep">Sales Rep</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-5">
                    <input 
                      type="text"
                      defaultValue={user.rep_id || ''}
                      placeholder="Assign ID..."
                      onBlur={(e) => {
                        if (e.target.value !== (user.rep_id || '')) {
                          handleUpdateUser(user.uid, { rep_id: e.target.value });
                        }
                      }}
                      disabled={updating === user.uid}
                      className="bg-slate-50 border-none rounded-lg text-xs font-bold px-4 py-2 focus:ring-2 focus:ring-brand/20 outline-none w-32 disabled:opacity-50 shadow-inner"
                    />
                  </td>
                  <td className="px-8 py-5 text-right">
                    {updating === user.uid ? (
                      <span className="text-[10px] font-black text-brand animate-pulse uppercase tracking-widest">Saving...</span>
                    ) : (
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">
                        {user.role === 'sales_rep' ? '✓ Rep Access' : 'No Rep Access'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
