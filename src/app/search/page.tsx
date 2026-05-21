import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/layout/Navbar';
import SearchForm from '@/components/flight/SearchForm';
import FlightCard from '@/components/flight/FlightCard';
import FlightResultsClient from './FlightResultsClient';
import { ToastProvider } from '@/components/ui/Toast';
import { FlightCardSkeleton } from '@/components/ui/Skeleton';
import type { Flight, SeatClass } from '@/types';

interface SearchPageProps {
  searchParams: {
    origin?: string;
    destination?: string;
    date?: string;
    passengers?: string;
    class?: string;
  };
}

async function getFlights(origin: string, destination: string, date: string): Promise<Flight[]> {
  const supabase = createClient();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .gte('departs_at', startOfDay.toISOString())
    .lte('departs_at', endOfDay.toISOString())
    .neq('status', 'cancelled')
    .order('departs_at', { ascending: true });

  if (error) {
    console.error('Error fetching flights:', error);
    return [];
  }
  return data ?? [];
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { origin, destination, date, passengers, class: cls } = searchParams;
  const hasSearch = origin && destination && date;

  let flights: Flight[] = [];
  if (hasSearch) {
    flights = await getFlights(origin, destination, date);
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-sky-950">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Search form */}
          <div className="glass-strong rounded-3xl p-6 mb-8">
            <h1 className="font-display text-xl font-bold text-white mb-5">Find Flights</h1>
            <SearchForm />
          </div>

          {/* Results */}
          {hasSearch && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    {origin} → {destination}
                  </h2>
                  <p className="text-sky-300/60 text-sm mt-0.5">
                    {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    {' · '}{passengers ?? 1} passenger{Number(passengers) > 1 ? 's' : ''}
                  </p>
                </div>
                <span className="glass px-3 py-1.5 rounded-full text-sm text-sky-300">
                  {flights.length} flight{flights.length !== 1 ? 's' : ''}
                </span>
              </div>

              {flights.length === 0 ? (
                <div className="card text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-sky-800/40 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✈️</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-2">No flights found</h3>
                  <p className="text-sky-300/60">Try a different date or route.</p>
                </div>
              ) : (
                <FlightResultsClient
                  flights={flights}
                  selectedClass={(cls as SeatClass) ?? 'economy'}
                />
              )}
            </div>
          )}

          {!hasSearch && (
            <div className="card text-center py-16">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-sky-300/60">Search for flights using the form above.</p>
            </div>
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
