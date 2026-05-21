'use client';

import { useState } from 'react';
import { Plane, Calendar, MapPin, Tag, RefreshCw, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Booking } from '@/types';
import { formatDateTime, formatPrice, statusColor, cn, flightDuration } from '@/lib/utils';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/store/userStore';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

interface BookingCardProps {
  booking: Booking;
  onCancelled: (id: string) => void;
}

export default function BookingCard({ booking, onCancelled }: BookingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { session } = useUserStore();
  const { showToast } = useToast();
  const router = useRouter();

  const flight = booking.flight!;
  const seat = booking.seat;
  const passenger = booking.passengers?.[0];

  const handleCancel = async () => {
    if (!session?.access_token) return;
    setCancelling(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('cancel_booking', {
        p_booking_id: booking.id,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error || !data?.success) {
        showToast(data?.error ?? error?.message ?? 'Cancellation failed', 'error');
      } else {
        showToast('Booking cancelled successfully', 'success');
        onCancelled(booking.id);
      }
    } finally {
      setCancelling(false);
      setShowCancel(false);
    }
  };

  const canCancel = booking.status !== 'cancelled';
  const isCancelled = booking.status === 'cancelled';

  return (
    <>
      <div className={cn('glass rounded-2xl overflow-hidden transition-all duration-200',
        isCancelled && 'opacity-60')}>
        {/* Header */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display font-bold text-white text-lg">{flight.flight_no}</span>
                <span className={cn('badge', statusColor(booking.status))}>{booking.status}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-sky-300/60">
                <Tag className="w-3 h-3" />
                <span className="font-mono font-bold text-sky-300">{booking.pnr_code}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-white">{formatPrice(booking.total_price)}</p>
              {seat && <p className="text-xs text-sky-300/60 capitalize">Seat {seat.seat_number} · {seat.class}</p>}
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xl font-display font-bold text-white">{flight.origin}</p>
              <p className="text-xs text-sky-300/60">{formatDateTime(flight.departs_at)}</p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-0.5">
              <p className="text-xs text-sky-300/50">{flightDuration(flight.departs_at, flight.arrives_at)}</p>
              <div className="w-full flex items-center gap-1">
                <div className="flex-1 h-px bg-sky-700/50" />
                <Plane className="w-3 h-3 text-sky-500 -rotate-45" />
                <div className="flex-1 h-px bg-sky-700/50" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-display font-bold text-white">{flight.destination}</p>
              <p className="text-xs text-sky-300/60">{formatDateTime(flight.arrives_at)}</p>
            </div>
          </div>
        </div>

        {/* Expandable details */}
        {expanded && passenger && (
          <div className="px-5 pb-4 border-t border-white/5 pt-4 space-y-2 animate-slide-down">
            <p className="text-xs text-sky-300/50 uppercase tracking-wider mb-2">Passenger Details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-sky-300/50 text-xs">Name</p>
                <p className="text-white font-medium">{passenger.full_name}</p>
              </div>
              <div>
                <p className="text-sky-300/50 text-xs">Nationality</p>
                <p className="text-white font-medium">{passenger.nationality}</p>
              </div>
              <div>
                <p className="text-sky-300/50 text-xs">Date of Birth</p>
                <p className="text-white font-medium">{new Date(passenger.dob).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sky-300/50 text-xs">Aircraft</p>
                <p className="text-white font-medium">{flight.aircraft_type}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="px-5 pb-4 flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-sky-300/60 hover:text-sky-300
              transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Less' : 'Details'}
          </button>

          {canCancel && (
            <>
              <button
                onClick={() => router.push(`/my-bookings/${booking.id}/reschedule`)}
                className="flex items-center gap-1.5 text-xs text-sky-300/70 hover:text-sky-200
                  transition-colors py-1.5 px-3 rounded-lg hover:bg-sky-600/20 ml-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reschedule
              </button>
              <button
                onClick={() => setShowCancel(true)}
                className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-300
                  transition-colors py-1.5 px-3 rounded-lg hover:bg-red-500/10"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showCancel}
        title="Cancel Booking"
        description={`Are you sure you want to cancel booking ${booking.pnr_code}? This action cannot be undone. Cancellations are not allowed within 2 hours of departure.`}
        confirmLabel="Yes, Cancel Booking"
        variant="danger"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setShowCancel(false)}
      />
    </>
  );
}
