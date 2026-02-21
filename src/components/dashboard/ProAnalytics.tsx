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
      },
      {
        label: 'Scans',
        data: data.history.map(h => h.scans),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
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
          font: { size: 10 },
          color: '#94a3b8',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10 },
          color: '#94a3b8',
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

  const [showSources, setShowSources] = useState(false);

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
        <div className="lg:col-span-8 premium-card p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold">Performance Overview</h2>
              <p className="text-xs text-muted font-medium mt-1">Daily reviews and scans for the last 30 days.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-brand"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Scans</span>
              </div>
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
          <div className="lg:col-span-6 premium-card p-8 rounded-3xl">
            <h2 className="text-lg font-bold mb-2">Rating Distribution</h2>
            <p className="text-xs text-muted font-medium mb-8">Granular breakdown of every rating received.</p>
            <div className="h-48">
              <Bar data={distData} options={chartOptions} />
            </div>
          </div>
        )}

        <div className="lg:col-span-6 premium-card p-8 rounded-3xl group relative">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">Top Performing Sources</h2>
            <button 
              onClick={() => setShowSources(!showSources)}
              className="text-[10px] font-black text-brand uppercase tracking-widest bg-brand/5 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors"
            >
              {showSources ? 'Hide Details' : 'View Breakdown'}
            </button>
          </div>
          <p className="text-xs text-muted font-medium mb-8">Which QR codes or links are driving results.</p>
          
          {showSources ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              {topSources.length > 0 ? (
                topSources.map(([src, count], i) => (
                  <div key={src} className="flex items-center justify-between p-3 bg-accent/30 rounded-xl border border-[#e2e8f0]/50">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-[10px] font-black border border-[#e2e8f0]">{i+1}</span>
                      <span className="text-sm font-bold capitalize">{src.replace(/-/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black">{count}</span>
                      <span className="text-[10px] font-bold text-muted uppercase">Leads</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">No sources recorded yet.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 group-hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => setShowSources(true)}>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 text-xl">📊</div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-widest">Click to view source breakdown</p>
              <p className="text-[10px] text-slate-400 mt-1">See which QR codes are performing best.</p>
            </div>
          )}
          
          {/* Tooltip */}
          <div className="absolute inset-x-0 -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2">
            <div className="bg-slate-900 text-white text-[9px] py-1.5 px-2 rounded-lg shadow-xl text-center font-bold uppercase tracking-widest leading-tight">
              Ranked list of your QR codes and links, showing which ones generate the most customer leads.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
