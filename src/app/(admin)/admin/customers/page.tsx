"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type Customer = {
  id: string;
  name: string;
  plan: string;
  mrr: string;
  signedUp: string;
  closedBy: string;
  status: string;
  months: number;
  lastLogin: string;
  email: string;
};

export default function AdminCustomers() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch customers');
      setCustomers(data.customers || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                           c.email.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "All" || c.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [customers, search, filter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-brand border-t-transparent rounded-full mb-4"></div>
        <p className="text-muted text-sm font-medium tracking-widest uppercase">Fetching Customers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-red-50 rounded-[40px] border border-red-100">
        <p className="text-red-600 font-black uppercase tracking-widest text-xs mb-2">Error Loading Customers</p>
        <p className="text-sm text-red-500 font-medium mb-6">{error}</p>
        <button onClick={fetchCustomers} className="primary-button !bg-red-600 !h-12 px-8">Try Again</button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Customers</h1>
          <p className="text-slate-500 font-medium mt-1">View and manage all businesses using Reviews & Marketing.</p>
        </div>
        <button 
          onClick={fetchCustomers}
          className="secondary-button !h-10 px-4 text-xs font-black uppercase tracking-widest"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex gap-2">
            {["All", "Active", "Trial", "Churned"].map((f) => (
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
              placeholder="Search by business or email..." 
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
                <th className="px-8 py-4">Business Name</th>
                <th className="px-4 py-4">Plan</th>
                <th className="px-4 py-4 text-center">MRR</th>
                <th className="px-4 py-4">Signed Up</th>
                <th className="px-4 py-4">Closed By</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-center">Months Active</th>
                <th className="px-8 py-4 text-right">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <span className="text-2xl">👥</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">No customers found</p>
                    <p className="text-xs text-slate-400 font-medium">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <Link href={`/admin/customers/${customer.id}`} className="block">
                        <p className="font-bold text-slate-900 group-hover:text-brand transition-colors">{customer.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{customer.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                        customer.plan === 'Unlimited' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        customer.plan === 'Small Business' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {customer.plan}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center font-black text-slate-900">{customer.mrr}</td>
                    <td className="px-4 py-5 text-slate-500 font-medium">{customer.signedUp}</td>
                    <td className="px-4 py-5 font-bold text-slate-700">{customer.closedBy}</td>
                    <td className="px-4 py-5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        customer.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                        customer.status === 'Trial' ? 'bg-blue-50 text-blue-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-center font-bold text-slate-700">{customer.months}</td>
                    <td className="px-8 py-5 text-right text-slate-400 text-xs font-bold">
                      {customer.lastLogin !== 'Never' ? (
                        formatDistanceToNow(new Date(customer.lastLogin), { addSuffix: true })
                      ) : 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

