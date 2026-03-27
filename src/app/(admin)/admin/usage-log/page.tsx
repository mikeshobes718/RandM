"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';

interface UsageLog {
  id: string;
  date: string;
  time: string;
  transactionId: string;
  businessName: string;
  placeId: string;
  action: string;
  cost: string;
  source: string;
  repId: string;
  repEmail: string;
}

export default function UsageLogPage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');

  useEffect(() => {
    fetch('/api/admin/usage-log')
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching usage logs:', err);
        setLoading(false);
      });
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.repEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.repId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = sourceFilter === 'All' || log.source === sourceFilter;
    
    return matchesSearch && matchesSource;
  });

  const totalCost = filteredLogs.reduce((sum, log) => {
    const cost = parseFloat(log.cost.replace('$', '')) || 0;
    return sum + cost;
  }, 0);

  const apiHits = filteredLogs.filter(l => l.source === 'Google Places API').length;
  const cachedHits = filteredLogs.filter(l => l.source === 'Database Cache').length;

  return (
    <AdminGuard allowedRoles={['admin', 'owner']}>
      <div className="min-h-screen bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-outline-variant/20">
        {/* Header */}
        <div className="border-b border-outline-variant/30 bg-surface/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <Link href="/admin" className="text-xs font-black uppercase tracking-[0.2em] text-brand hover:text-brand/80 transition-colors">
                  ← Admin
                </Link>
                <h1 className="text-3xl font-black text-on-surface tracking-tight mt-2">Usage Log</h1>
                <p className="text-sm text-on-surface-variant mt-1">Detailed Google Places API usage tracking from Google Sheets</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant/60 mb-2">Total Hits</p>
              <p className="text-3xl font-black text-on-surface">{filteredLogs.length}</p>
            </div>
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant/60 mb-2">API Calls (Charged)</p>
              <p className="text-3xl font-black text-rose-500">{apiHits}</p>
            </div>
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant/60 mb-2">Cached (Free)</p>
              <p className="text-3xl font-black text-emerald-500">{cachedHits}</p>
            </div>
            <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant/60 mb-2">Total Cost</p>
              <p className="text-3xl font-black text-brand">${totalCost.toFixed(2)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-surface p-6 rounded-2xl border border-outline-variant/30 shadow-sm mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <input
                  type="text"
                  placeholder="Search by business, rep email, rep ID, or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm"
                />
              </div>
              <div>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-4 py-2 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-sm font-medium"
                >
                  <option value="All">All Sources</option>
                  <option value="Google Places API">Google API</option>
                  <option value="Database Cache">Cached</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-outline-variant/20 overflow-hidden">
            <div className="overflow-x-auto max-h-[700px] overflow-y-auto custom-scrollbar relative">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-surface shadow-sm">
                  <tr className="bg-surface-container-lowest/50 border-b border-outline-variant/20">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Time (EST)</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Transaction ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Business Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Action</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Cost</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Source</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Rep ID</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Rep Email</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-on-surface-variant/60 font-medium italic">
                        Loading usage logs...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-on-surface-variant/60 font-medium italic">
                        No usage logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-outline-variant/20 hover:bg-surface-container-lowest/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-on-surface font-medium">{log.date}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-on-surface-variant">{log.time}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-on-surface-variant">{log.transactionId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-on-surface font-medium">{log.businessName}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs text-on-surface-variant">{log.action}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`text-sm font-bold ${parseFloat(log.cost.replace('$', '')) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {log.cost}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            log.source === 'Google Places API' 
                              ? 'bg-rose-50 text-rose-700' 
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {log.source === 'Google Places API' ? 'API' : 'Cached'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-on-surface-variant font-medium">{log.repId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-on-surface-variant">{log.repEmail}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-on-surface-variant">
            Showing {filteredLogs.length} of {logs.length} total usage logs
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
