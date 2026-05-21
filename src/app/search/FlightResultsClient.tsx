'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import FlightCard from '@/components/flight/FlightCard';
import { useFlightStore } from '@/store/flightStore';
import type { Flight, SeatClass } from '@/types';

interface FlightResultsClientProps {
  flights: Flight[];
  selectedClass: SeatClass;
}

export default function FlightResultsClient({ flights, selectedClass }: FlightResultsClientProps) {
  const router = useRouter();
  const { setSelectedFlight, setCurrentStep, setSelectedClass } = useFlightStore();
  const [cls, setCls] = useState<SeatClass>(selectedClass);

  const handleSelect = (flight: Flight) => {
    setSelectedFlight(flight);
    setSelectedClass(cls);
    setCurrentStep('seat');
    router.push(`/booking?flightId=${flight.id}`);
  };

  return (
    <div>
      {/* Class filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {(['economy', 'business', 'first'] as SeatClass[]).map((c) => (
          <button
            key={c}
            onClick={() => setCls(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200
              ${cls === c
                ? 'bg-sky-600 text-white'
                : 'glass text-sky-200/70 hover:text-white hover:bg-white/10'
              }`}
          >
            {c === 'economy' ? 'Economy' : c === 'business' ? 'Business' : 'First Class'}
          </button>
        ))}
      </div>

      {/* Flight list */}
      <div className="space-y-4">
        {flights.map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            onSelect={handleSelect}
            selectedClass={cls}
          />
        ))}
      </div>
    </div>
  );
}
