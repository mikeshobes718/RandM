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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-12">
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
        <h2 className="text-xl font-bold mb-2">Customer Sentiment</h2>
        <p className="text-xs text-muted font-medium mb-8">Overall rating distribution from feedback.</p>
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
  );
}

