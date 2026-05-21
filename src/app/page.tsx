import Link from 'next/link';
import { Plane, Shield, Zap, Star } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import SearchForm from '@/components/flight/SearchForm';
import { ToastProvider } from '@/components/ui/Toast';

export default function Home() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-sky-950">
        <Navbar />

        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900/50 via-sky-950 to-sky-950" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-700/20 via-transparent to-transparent" />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 md:pt-24 md:pb-16">
            <div className="text-center mb-10 animate-fade-in">
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 text-sm text-sky-300">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                Trusted by thousands of passengers
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                Fly Anywhere,<br />
                <span className="text-sky-400">Seamlessly</span>
              </h1>
              <p className="text-sky-200/60 text-lg max-w-xl mx-auto">
                Search, book and manage your flights with real-time seat selection and instant confirmation.
              </p>
            </div>

            {/* Search card */}
            <div className="glass-strong rounded-3xl p-6 md:p-8 animate-slide-up shadow-2xl">
              <SearchForm />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Instant Booking',
                desc: 'Real-time seat availability with atomic reservations — no double-bookings, ever.',
                color: 'text-yellow-400 bg-yellow-400/10',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                desc: 'Your data is protected with row-level security. Sensitive info never leaves your device.',
                color: 'text-emerald-400 bg-emerald-400/10',
              },
              {
                icon: Plane,
                title: 'Live Seat Maps',
                desc: 'Watch seats update in real time as other passengers book. Never select a taken seat.',
                color: 'text-sky-400 bg-sky-400/10',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card hover:bg-white/[0.08] transition-all duration-200">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-sky-200/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Popular routes */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="section-title mb-6">Popular Routes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { from: 'Delhi', to: 'Mumbai', price: '₹4,500' },
              { from: 'Bengaluru', to: 'Hyderabad', price: '₹3,200' },
              { from: 'Chennai', to: 'Kolkata', price: '₹5,500' },
              { from: 'Delhi', to: 'Bengaluru', price: '₹6,800' },
            ].map(({ from, to, price }) => (
              <Link
                key={`${from}-${to}`}
                href={`/search?origin=${from}&destination=${to}&date=${new Date().toISOString().split('T')[0]}&passengers=1&class=economy`}
                className="card-hover text-center group"
              >
                <p className="text-sm font-semibold text-white">{from} → {to}</p>
                <p className="text-xs text-sky-300/60 mt-1">From <span className="text-sky-400 font-bold">{price}</span></p>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 text-center text-sky-300/30 text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Plane className="w-4 h-4 -rotate-45" />
            <span className="font-display font-bold text-sky-300/50">SkyWave</span>
          </div>
          <p>© 2026 SkyWave Flight Management. Built with Next.js & Supabase.</p>
        </footer>
      </div>
    </ToastProvider>
  );
}
