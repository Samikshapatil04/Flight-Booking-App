import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/layout/Navbar';
import { ToastProvider } from '@/components/ui/Toast';
import MyBookingsClient from './MyBookingsClient';
import type { Booking } from '@/types';

export default async function MyBookingsPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let bookings: Booking[] = [];
  if (user) {
    const { data } = await supabase
      .from('bookings')
      .select('*, flight:flights(*), seat:seats(*), passengers(*)')
      .eq('user_id', user.id)
      .order('booked_at', { ascending: false });
    bookings = data ?? [];
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-sky-950">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-white mb-1">My Bookings</h1>
            <p className="text-sky-300/60">Manage and track all your flight bookings.</p>
          </div>
          <MyBookingsClient initialBookings={bookings} />
        </div>
      </div>
    </ToastProvider>
  );
}
