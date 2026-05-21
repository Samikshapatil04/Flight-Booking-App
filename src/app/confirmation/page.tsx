import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/layout/Navbar';
import { ToastProvider } from '@/components/ui/Toast';
import { formatDateTime, formatPrice, flightDuration } from '@/lib/utils';
import Link from 'next/link';
import { CheckCircle, Plane, Ticket, Download } from 'lucide-react';
import type { Booking } from '@/types';

interface ConfirmationPageProps {
  searchParams: { bookingId?: string; pnr?: string };
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { bookingId, pnr } = searchParams;

  let booking: Booking | null = null;

  if (bookingId) {
    const supabase = createClient();
    const { data } = await supabase
      .from('bookings')
      .select('*, flight:flights(*), seat:seats(*), passengers(*)')
      .eq('id', bookingId)
      .single();
    booking = data;
  }

  if (!booking) {
    return (
      <ToastProvider>
        <div className="min-h-screen bg-sky-950">
          <Navbar />
          <div className="max-w-xl mx-auto px-4 py-16 text-center">
            <p className="text-sky-300/60">Booking not found.</p>
            <Link href="/" className="btn-primary mt-4 inline-block">Go Home</Link>
          </div>
        </div>
      </ToastProvider>
    );
  }

  const flight = booking.flight!;
  const seat = booking.seat!;
  const passenger = booking.passengers?.[0];

  return (
    <ToastProvider>
      <div className="min-h-screen bg-sky-950">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
          {/* Success header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">Booking Confirmed!</h1>
            <p className="text-sky-300/60">Your booking has been confirmed. Have a great flight!</p>
          </div>

          {/* PNR card */}
          <div className="glass-strong rounded-3xl p-6 mb-6 animate-slide-up">
            <div className="text-center mb-6 pb-6 border-b border-white/10">
              <p className="text-xs text-sky-300/50 uppercase tracking-widest mb-2">Booking Reference (PNR)</p>
              <p className="font-mono text-4xl font-black tracking-[0.3em] text-white bg-sky-600/20
                rounded-2xl px-6 py-3 inline-block border border-sky-600/30">
                {booking.pnr_code}
              </p>
            </div>

            {/* Flight info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-sky-600/30 flex items-center justify-center shrink-0">
                <Plane className="w-5 h-5 text-sky-400 -rotate-45" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{flight.flight_no}</span>
                  <span className="text-sky-300/60 text-sm">{flight.aircraft_type}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="min-w-0">
                <p className="text-2xl font-display font-bold text-white">{flight.origin}</p>
                <p className="text-sm text-sky-300/60">{formatDateTime(flight.departs_at)}</p>
              </div>
              <div className="flex-1 flex flex-col items-center gap-0.5">
                <p className="text-xs text-sky-300/50">{flightDuration(flight.departs_at, flight.arrives_at)}</p>
                <div className="w-full flex items-center gap-1">
                  <div className="flex-1 h-px bg-sky-700/50" />
                  <Plane className="w-3 h-3 text-sky-500 -rotate-45" />
                  <div className="flex-1 h-px bg-sky-700/50" />
                </div>
              </div>
              <div className="min-w-0 text-right">
                <p className="text-2xl font-display font-bold text-white">{flight.destination}</p>
                <p className="text-sm text-sky-300/60">{formatDateTime(flight.arrives_at)}</p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Seat', value: `${seat.seat_number} · ${seat.class}` },
                { label: 'Total Paid', value: formatPrice(booking.total_price) },
                ...(passenger ? [
                  { label: 'Passenger', value: passenger.full_name },
                  { label: 'Nationality', value: passenger.nationality },
                ] : []),
              ].map(({ label, value }) => (
                <div key={label} className="glass rounded-xl p-3">
                  <p className="text-xs text-sky-300/50 mb-0.5">{label}</p>
                  <p className="font-semibold text-white capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/my-bookings" className="flex-1 btn-secondary flex items-center justify-center gap-2">
              <Ticket className="w-4 h-4" />
              My Bookings
            </Link>
            <Link href="/search" className="flex-1 btn-primary flex items-center justify-center gap-2">
              <Plane className="w-4 h-4" />
              Book Again
            </Link>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
