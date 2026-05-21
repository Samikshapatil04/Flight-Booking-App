'use client';

import { useState, useEffect } from 'react';
import { Ticket } from 'lucide-react';
import BookingCard from '@/components/booking/BookingCard';
import { useUserStore } from '@/store/userStore';
import type { Booking, BookingStatus } from '@/types';
import Link from 'next/link';

interface MyBookingsClientProps {
  initialBookings: Booking[];
}

const STATUS_FILTERS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Rescheduled', value: 'rescheduled' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function MyBookingsClient({ initialBookings }: MyBookingsClientProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const { setCachedBookings } = useUserStore();

  useEffect(() => {
    setCachedBookings(initialBookings);
  }, [initialBookings, setCachedBookings]);

  const handleCancelled = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b))
    );
  };

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200
              ${filter === value
                ? 'bg-sky-600 text-white'
                : 'glass text-sky-200/70 hover:text-white hover:bg-white/10'
              }`}
          >
            {label}
            {value !== 'all' && (
              <span className={`ml-1.5 text-xs ${filter === value ? 'text-sky-200' : 'text-sky-400/50'}`}>
                {bookings.filter((b) => b.status === value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-sky-800/40 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-sky-400/40" />
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-2">No bookings yet</h3>
          <p className="text-sky-300/60 mb-6">
            {filter === 'all' ? "You haven't made any bookings yet." : `No ${filter} bookings.`}
          </p>
          {filter === 'all' && (
            <Link href="/search" className="btn-primary inline-flex">
              Search Flights
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancelled={handleCancelled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
