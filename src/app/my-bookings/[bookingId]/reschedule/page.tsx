import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/layout/Navbar';
import { ToastProvider } from '@/components/ui/Toast';
import RescheduleClient from './RescheduleClient';
import { notFound } from 'next/navigation';
import type { Booking, Flight } from '@/types';

interface ReschedulePageProps {
  params: { bookingId: string };
}

export default async function ReschedulePage({ params }: ReschedulePageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, flight:flights(*), seat:seats(*)')
    .eq('id', params.bookingId)
    .eq('user_id', user.id)
    .single();

  if (!booking) notFound();

  // Get alternative flights on the same route
  const { data: flights } = await supabase
    .from('flights')
    .select('*')
    .eq('origin', booking.flight.origin)
    .eq('destination', booking.flight.destination)
    .neq('id', booking.flight_id)
    .neq('status', 'cancelled')
    .gte('departs_at', new Date().toISOString())
    .order('departs_at', { ascending: true });

  return (
    <ToastProvider>
      <div className="min-h-screen bg-sky-950">
        <Navbar />
        <RescheduleClient
          booking={booking as Booking}
          availableFlights={(flights ?? []) as Flight[]}
        />
      </div>
    </ToastProvider>
  );
}
