"use client";
export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-surface-container-lowest via-surface to-red-50 py-10">
      <div className="max-w-xl mx-auto px-4 text-center space-y-4">
        <h1 className="text-3xl font-bold text-on-surface">Something went wrong</h1>
        <p className="text-on-surface-variant">{error?.message || 'An unexpected error occurred while loading your dashboard.'}</p>
        <button onClick={reset} className="rounded-xl px-4 py-2 bg-inverse-surface text-white">Try again</button>
      </div>
    </main>
  );
}

