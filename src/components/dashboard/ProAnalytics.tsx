"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { useState } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

type Analytics = {
  history: { date: string; reviews: number; scans: number }[];
  sentiment: { positive: number; neutral: number; negative: number };
  ratingDistribution?: Record<number, number>;
  funnel?: { scans: number; selections: number; completions: number };
  sources?: Record<string, number>;
  growth?: number;
};

export default function ProAnalytics({ data }: { data: Analytics }) {
  const [showSources, setShowSources] = useState(false);
  const [showReviews, setShowReviews] = useState(true);
  const [showScans, setShowScans] = useState(true);

  const lineData = {
    labels: data.history.map(h => {
        const d = new Date(h.date);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Reviews',
        data: data.history.map(h => h.reviews),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4,
        hidden: !showReviews,
      },
      {
        label: 'Scans',
        data: data.history.map(h => h.scans),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        hidden: !showScans,
      }
    ]
  };

  const sentimentData = {
    labels: ['Positive (4-5★)', 'Neutral (3★)', 'Negative (1-2★)'],
    datasets: [
      {
        data: [data.sentiment.positive, data.sentiment.neutral, data.sentiment.negative],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      }
    ]
  };

  const distData = data.ratingDistribution ? {
    labels: ['1★', '2★', '3★', '4★', '5★'],
    datasets: [
      {
        label: 'Reviews',
        data: [
          data.ratingDistribution[1] || 0,
          data.ratingDistribution[2] || 0,
          data.ratingDistribution[3] || 0,
          data.ratingDistribution[4] || 0,
          data.ratingDistribution[5] || 0
        ],
        backgroundColor: '#4f46e5',
        borderRadius: 8,
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 12 },
        padding: 12,
        borderRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0,0,0,0.03)',
        },
        ticks: {
          font: { size: 8 },
          color: '#94a3b8',
          maxTicksLimit: 5,
          padding: 8,
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 8 },
          color: '#94a3b8',
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 5,
          padding: 8,
          callback: function(this: any, value: string | number, index: number): string {
            const label: string = this.getLabelForValue(value as number);
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            if (isMobile) return index % 6 === 0 ? label : '';
            return label;
          }
        }
      }
    }
  };

  const conversionRate = data.funnel && data.funnel.scans > 0 
    ? Math.min(100, Math.round((data.funnel.completions / data.funnel.scans) * 100)) 
    : 0;

  const topSources = data.sources 
    ? Object.entries(data.sources)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-6 mt-12">
      {/* Conversion Funnel Row */}
      {data.funnel && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="premium-card p-6 rounded-2xl group relative">
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Total Scans</div>
            <div className="text-2xl font-black">{data.funnel.scans}</div>
            <div className="absolute inset-x-0 -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2">
              <div className="bg-slate-900 text-white text-[9px] py-1.5 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest">
                All-time QR code and link opens.
              </div>
            </div>
          </div>
          <div className="premium-card p-6 rounded-2xl group relative">
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Interactions</div>
            <div className="text-2xl font-black">{data.funnel.selections}</div>
            <div className="absolute inset-x-0 -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2">
              <div className="bg-slate-900 text-white text-[9px] py-1.5 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest">
                Customers who clicked a star rating.
              </div>
            </div>
          </div>
          <div className="premium-card p-6 rounded-2xl group relative">
            <div className="flex justify-between items-start mb-1">
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Total Leads</div>
              {data.growth !== undefined && (
                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${data.growth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {data.growth >= 0 ? '↑' : '↓'} {Math.abs(data.growth)}%
                </div>
              )}
            </div>
            <div className="text-2xl font-black">{data.funnel.completions}</div>
            <div className="absolute inset-x-0 -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2">
              <div className="bg-slate-900 text-white text-[9px] py-1.5 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest">
                Successful conversions (Google opened or private message sent).
              </div>
            </div>
          </div>
          <div className="premium-card p-6 rounded-2xl bg-brand/5 border-[#e2e8f0] group relative">
            <div className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">Conversion</div>
            <div className="text-2xl font-black text-brand">{conversionRate}%</div>
            <div className="absolute inset-x-0 -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2">
              <div className="bg-slate-900 text-white text-[9px] py-1.5 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest">
                Percentage of scans that result in a lead.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 premium-card p-4 sm:p-8 rounded-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold">Performance Overview</h2>
              <p className="text-xs text-muted font-medium mt-1">Daily reviews and scans for the last 30 days.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowReviews(!showReviews)}
                className={`flex items-center gap-2 transition-opacity ${!showReviews ? 'opacity-40' : 'hover:opacity-80'}`}
              >
                <span className="w-3 h-3 rounded-full bg-brand"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Reviews</span>
              </button>
              <button 
                onClick={() => setShowScans(!showScans)}
                className={`flex items-center gap-2 transition-opacity ${!showScans ? 'opacity-40' : 'hover:opacity-80'}`}
              >
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Scans</span>
              </button>
            </div>
          </div>
          <div className="h-64">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        <div className="lg:col-span-4 premium-card p-8 rounded-3xl flex flex-col">
          <h2 className="text-xl font-bold mb-2">Feedback Sentiment</h2>
          <p className="text-xs text-muted font-medium mb-8">Overall mood from your private customer feedback.</p>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-48 h-48">
              <Doughnut 
                  data={sentimentData} 
                  options={{ 
                      ...chartOptions, 
                      cutout: '75%',
                      plugins: { legend: { display: false } } 
                  }} 
              />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-black">{Math.round((data.sentiment.positive / (data.sentiment.positive + data.sentiment.neutral + data.sentiment.negative || 1)) * 100)}%</div>
              <div className="text-[8px] font-bold text-muted uppercase tracking-widest">Positive</div>
            </div>
          </div>
          <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-medium text-muted">Positive</span>
                  </div>
                  <span className="text-xs font-bold">{data.sentiment.positive}</span>
              </div>
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="text-xs font-medium text-muted">Neutral</span>
                  </div>
                  <span className="text-xs font-bold">{data.sentiment.neutral}</span>
              </div>
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="text-xs font-medium text-muted">Negative</span>
                  </div>
                  <span className="text-xs font-bold">{data.sentiment.negative}</span>
              </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {distData && (
          <div className="lg:col-span-12 premium-card p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Rating Distribution</h2>
              <button 
                onClick={() => { /* Data syncs automatically from the dashboard */ }}
                className="text-[10px] font-black text-brand uppercase tracking-widest bg-brand/5 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Sync Data
              </button>
            </div>
            <p className="text-xs text-muted font-medium mb-8">Granular breakdown of every rating received.</p>
            <div className="h-48">
              <Bar data={distData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
