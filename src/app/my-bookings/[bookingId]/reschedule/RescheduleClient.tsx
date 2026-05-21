'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Plane } from 'lucide-react';
import { Booking, Flight, Seat } from '@/types';
import { formatDateTime, formatPrice, flightDuration, cn } from '@/lib/utils';
import SeatMap from '@/components/seat/SeatMap';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';

interface RescheduleClientProps {
  booking: Booking;
  availableFlights: Flight[];
}

export default function RescheduleClient({ booking, availableFlights }: RescheduleClientProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const priceDiff = selectedFlight
    ? (selectedFlight.base_price + (selectedSeat?.extra_fee ?? 0)) - booking.total_price
    : 0;

  const handleReschedule = async () => {
    if (!selectedFlight || !selectedSeat) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('reschedule_booking', {
        p_booking_id: booking.id,
        p_new_flight_id: selectedFlight.id,
        p_new_seat_id: selectedSeat.id,
        p_user_id: user.id,
      });

      if (error || !data?.success) {
        showToast(data?.error ?? error?.message ?? 'Reschedule failed', 'error');
      } else {
        showToast(
          `Rescheduled! ${data.fee_charged > 0 ? `Additional charge: ${formatPrice(data.fee_charged)}` : 'No extra charge.'}`,
          'success'
        );
        router.push('/my-bookings');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sky-300/60 hover:text-sky-300 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Bookings
      </button>

      <h1 className="font-display text-2xl font-bold text-white mb-2">Reschedule Booking</h1>
      <p className="text-sky-300/60 mb-6">Current: <span className="text-sky-300">{booking.flight?.flight_no}</span>
        {' · '}{booking.flight?.origin} → {booking.flight?.destination}
        {' · '}{formatDateTime(booking.flight?.departs_at ?? '')}</p>

      {/* Available flights */}
      <div className="space-y-3 mb-6">
        <h2 className="font-semibold text-white">Choose a new flight</h2>
        {availableFlights.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-sky-300/60">No alternative flights available on this route.</p>
          </div>
        ) : (
          availableFlights.map((flight) => (
            <div
              key={flight.id}
              onClick={() => { setSelectedFlight(flight); setSelectedSeat(null); }}
              className={cn(
                'glass rounded-2xl p-4 cursor-pointer transition-all duration-200',
                selectedFlight?.id === flight.id
                  ? 'ring-2 ring-sky-500 bg-sky-600/10'
                  : 'hover:bg-white/[0.08]'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-600/20 flex items-center justify-center">
                    <Plane className="w-4 h-4 text-sky-400 -rotate-45" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{flight.flight_no}</p>
                    <p className="text-xs text-sky-300/60">{formatDateTime(flight.departs_at)}</p>
                    <p className="text-xs text-sky-300/40">{flightDuration(flight.departs_at, flight.arrives_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{formatPrice(flight.base_price)}</p>
                  {flight.base_price > booking.total_price && (
                    <p className="text-xs text-yellow-400">+{formatPrice(flight.base_price - booking.total_price)}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Seat selection for chosen flight */}
      {selectedFlight && (
        <div className="card mb-6 animate-slide-up">
          <h2 className="font-semibold text-white mb-4">Select a new seat</h2>
          <SeatMap
            flightId={selectedFlight.id}
            onSeatSelect={setSelectedSeat}
          />
        </div>
      )}

      {/* Confirm button */}
      {selectedFlight && selectedSeat && (
        <div className="glass-strong rounded-2xl p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-sky-300/60">New total</p>
              <p className="text-xl font-bold text-white">
                {formatPrice(selectedFlight.base_price + selectedSeat.extra_fee)}
              </p>
            </div>
            {priceDiff > 0 && (
              <div className="text-right">
                <p className="text-xs text-yellow-400">Additional fee</p>
                <p className="font-bold text-yellow-400">{formatPrice(priceDiff)}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Confirm Reschedule
          </button>
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Confirm Reschedule"
        description={`You are rescheduling to ${selectedFlight?.flight_no} on ${formatDateTime(selectedFlight?.departs_at ?? '')}.${priceDiff > 0 ? ` An additional charge of ${formatPrice(priceDiff)} applies.` : ' No extra charge.'}`}
        confirmLabel="Reschedule Booking"
        variant="warning"
        loading={submitting}
        onConfirm={handleReschedule}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
