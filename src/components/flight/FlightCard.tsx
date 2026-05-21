'use client';

import { Plane, Clock, ArrowRight, Zap } from 'lucide-react';
import { Flight } from '@/types';
import { formatTime, formatDate, flightDuration, formatPrice, statusColor, cn } from '@/lib/utils';

interface FlightCardProps {
  flight: Flight;
  onSelect: (flight: Flight) => void;
  selectedClass: 'economy' | 'business' | 'first';
}

const classPriceMultiplier: Record<string, number> = {
  economy: 1,
  business: 2.5,
  first: 4.5,
};

export default function FlightCard({ flight, onSelect, selectedClass }: FlightCardProps) {
  const price = flight.base_price * classPriceMultiplier[selectedClass];
  const duration = flightDuration(flight.departs_at, flight.arrives_at);

  return (
    <div className="glass rounded-2xl p-5 hover:bg-white/[0.08] transition-all duration-200 group">
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-600/30 flex items-center justify-center">
            <Plane className="w-3.5 h-3.5 text-sky-400 -rotate-45" />
          </div>
          <span className="text-xs font-bold text-sky-300 tracking-widest">{flight.flight_no}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('badge', statusColor(flight.status))}>{flight.status}</span>
          <span className="text-xs text-sky-300/50">{flight.aircraft_type}</span>
        </div>
      </div>

      {/* Route row */}
      <div className="flex items-center gap-3 mb-4">
        {/* Departure */}
        <div className="min-w-0">
          <p className="text-2xl font-display font-bold text-white leading-none">
            {formatTime(flight.departs_at)}
          </p>
          <p className="text-sm text-sky-200/70 mt-0.5 truncate">{flight.origin}</p>
          <p className="text-xs text-sky-300/40 mt-0.5">{formatDate(flight.departs_at)}</p>
        </div>

        {/* Duration line */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0 px-2">
          <div className="flex items-center gap-1 text-xs text-sky-300/60">
            <Clock className="w-3 h-3" />
            <span>{duration}</span>
          </div>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px bg-sky-700/50" />
            <Plane className="w-3.5 h-3.5 text-sky-500 -rotate-45 shrink-0" />
            <div className="flex-1 h-px bg-sky-700/50" />
          </div>
          <span className="text-xs text-sky-300/40">Direct</span>
        </div>

        {/* Arrival */}
        <div className="min-w-0 text-right">
          <p className="text-2xl font-display font-bold text-white leading-none">
            {formatTime(flight.arrives_at)}
          </p>
          <p className="text-sm text-sky-200/70 mt-0.5 truncate">{flight.destination}</p>
          <p className="text-xs text-sky-300/40 mt-0.5">{formatDate(flight.arrives_at)}</p>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div>
          <p className="text-xl font-bold text-white">{formatPrice(price)}</p>
          <p className="text-xs text-sky-300/60 capitalize">{selectedClass} class</p>
        </div>
        <button
          onClick={() => onSelect(flight)}
          className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
        >
          Select
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
