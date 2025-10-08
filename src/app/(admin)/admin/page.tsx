"use client";
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';

interface DashboardMetrics {
  totalAccounts: number;
  activeSubscriptions: {
    starter: number;
    pro: number;
    total: number;
  };
  mrr: number;
  businessesCount: number;
  completedOnboarding: number;
  recentReviews: number;
  recentSignups: number;
  onboardingCompletionRate: number;
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;
      
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/admin/dashboard/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={fetchMetrics}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8">
        <div className="text-gray-600">No metrics available</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">Business health metrics and key performance indicators</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Accounts */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalAccounts.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeSubscriptions.total}</p>
              <p className="text-xs text-gray-500">
                {metrics.activeSubscriptions.starter} Starter, {metrics.activeSubscriptions.pro} Pro
              </p>
            </div>
          </div>
        </div>

        {/* MRR */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${metrics.mrr.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Signups (30d)</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.recentSignups}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Businesses */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Profiles</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Businesses</span>
              <span className="font-medium">{metrics.businessesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completed Onboarding</span>
              <span className="font-medium">{metrics.completedOnboarding}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="font-medium">{metrics.onboardingCompletionRate}%</span>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Recent Reviews (30d)</span>
              <span className="font-medium">{metrics.recentReviews}</span>
            </div>
            <div className="text-xs text-gray-500">
              Review tracking coming soon
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
              View All Users
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
              Manage Subscriptions
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
              View Support Tickets
            </button>
            <button 
              onClick={fetchMetrics}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
            >
              Refresh Metrics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

