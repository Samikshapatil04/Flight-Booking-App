

'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-sky-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">✈️</div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">You're Offline</h1>
        <p className="text-sky-300/60 mb-6 leading-relaxed">
          No internet connection detected. Your cached bookings are still available in the My Bookings section.
        </p>
        <div className="space-y-3">
          <a href="/my-bookings" className="block w-full btn-primary text-center">
            View My Bookings
          </a>
          <button onClick={() => window.location.reload()} className="w-full btn-secondary">
            Try Again
          </button>
        </div>
        <p className="text-xs text-sky-300/30 mt-6">SkyWave — Flight Management</p>
      </div>
    </div>
  );
}