'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/flightStore';
import { formatPrice, cn } from '@/lib/utils';
import type { Seat, SeatClass } from '@/types';

interface SeatMapProps {
  flightId: string;
  existingSeatId?: string; // for rescheduling
  onSeatSelect?: (seat: Seat) => void;
}

const CLASS_ORDER: SeatClass[] = ['first', 'business', 'economy'];
const CLASS_LABELS: Record<SeatClass, string> = {
  first: '✦ First Class',
  business: '◆ Business',
  economy: '● Economy',
};
const CLASS_ROW_BG: Record<SeatClass, string> = {
  first: 'bg-yellow-500/5 border-yellow-500/20',
  business: 'bg-purple-500/5 border-purple-500/20',
  economy: 'bg-sky-500/5 border-sky-500/20',
};

function groupByRow(seats: Seat[]): Map<number, Seat[]> {
  const map = new Map<number, Seat[]>();
  for (const s of seats) {
    const row = parseInt(s.seat_number.replace(/\D/g, ''), 10);
    if (!map.has(row)) map.set(row, []);
    map.get(row)!.push(s);
  }
  return map;
}

export default function SeatMap({ flightId, existingSeatId, onSeatSelect }: SeatMapProps) {
  const { selectedSeat, setSelectedSeat, optimisticSeatId, setOptimisticSeatId } = useFlightStore();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ id: string; text: string } | null>(null);

  const fetchSeats = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('seat_number');
    if (data) setSeats(data);
    setLoading(false);
  }, [flightId]);

  useEffect(() => {
    fetchSeats();

    // Realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`seats-${flightId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'seats', filter: `flight_id=eq.${flightId}` },
        (payload) => {
          setSeats((prev) =>
            prev.map((s) => (s.id === payload.new.id ? (payload.new as Seat) : s))
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [flightId, fetchSeats]);

  const handleSeatClick = (seat: Seat) => {
    if (!seat.is_available && seat.id !== existingSeatId) return;
    // Optimistic update
    setOptimisticSeatId(seat.id);
    setSelectedSeat(seat);
    onSeatSelect?.(seat);
  };

  const seatsByClass = CLASS_ORDER.reduce<Record<SeatClass, Seat[]>>(
    (acc, cls) => {
      acc[cls] = seats.filter((s) => s.class === cls);
      return acc;
    },
    { first: [], business: [], economy: [] }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { color: 'bg-sky-600 border-sky-400', label: 'Available' },
          { color: 'bg-sky-500 border-sky-300', label: 'Selected' },
          { color: 'bg-slate-700 border-slate-600 opacity-50', label: 'Occupied' },
          { color: 'bg-emerald-500 border-emerald-300', label: 'Your Seat' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn('w-4 h-4 rounded border', color)} />
            <span className="text-sky-300/70">{label}</span>
          </div>
        ))}
      </div>

      {/* Plane nose indicator */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-1 opacity-40">
          <div className="w-16 h-8 border-2 border-sky-600/50 rounded-t-full" />
          <span className="text-xs text-sky-400">Front</span>
        </div>
      </div>

      {/* Cabin sections */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[320px] space-y-6">
          {CLASS_ORDER.map((cls) => {
            const clsSeats = seatsByClass[cls];
            if (!clsSeats.length) return null;

            const rowMap = groupByRow(clsSeats);
            const sortedRows = Array.from(rowMap.keys()).sort((a, b) => a - b);

            // Determine columns per row for this class
            const maxCols = Math.max(...sortedRows.map((r) => rowMap.get(r)!.length));

            return (
              <div key={cls} className={cn('rounded-xl border p-4', CLASS_ROW_BG[cls])}>
                <h3 className="text-xs font-bold text-sky-300/80 uppercase tracking-widest mb-3">
                  {CLASS_LABELS[cls]}
                </h3>

                <div className="space-y-1.5">
                  {sortedRows.map((rowNum) => {
                    const rowSeats = rowMap.get(rowNum)!
                      .sort((a, b) => a.seat_number.localeCompare(b.seat_number));

                    return (
                      <div key={rowNum} className="flex items-center gap-1.5">
                        {/* Row number */}
                        <span className="text-xs text-sky-400/40 w-5 text-right shrink-0">
                          {rowNum}
                        </span>

                        {/* Seats with aisle gap */}
                        <div className="flex gap-1">
                          {rowSeats.map((seat, i) => {
                            const isSelected = (optimisticSeatId ?? selectedSeat?.id) === seat.id;
                            const isYourSeat = seat.id === existingSeatId;
                            const isOccupied = !seat.is_available && !isYourSeat;

                            let seatClass = '';
                            if (isYourSeat) seatClass = 'bg-emerald-500 border-emerald-300 text-white';
                            else if (isSelected) seatClass = 'bg-sky-500 border-sky-300 text-white scale-110 shadow-lg shadow-sky-500/30';
                            else if (isOccupied) seatClass = 'bg-slate-700/40 border-slate-600/30 text-slate-500 cursor-not-allowed opacity-50';
                            else if (cls === 'first') seatClass = 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300 hover:bg-yellow-500 hover:text-white hover:scale-110 cursor-pointer';
                            else if (cls === 'business') seatClass = 'bg-purple-800/40 border-purple-600/40 text-purple-300 hover:bg-purple-600 hover:text-white hover:scale-110 cursor-pointer';
                            else seatClass = 'bg-sky-800/60 border-sky-600/40 text-sky-200 hover:bg-sky-600 hover:text-white hover:scale-110 cursor-pointer';

                            // Add aisle gap after middle seats
                            const aisleAfter = maxCols === 6 && i === 2;

                            return (
                              <div key={seat.id} className={cn('flex gap-1', aisleAfter && 'mr-3')}>
                                <div className="relative">
                                  <button
                                    type="button"
                                    disabled={isOccupied}
                                    onClick={() => handleSeatClick(seat)}
                                    onMouseEnter={() => setTooltip({
                                      id: seat.id,
                                      text: `${seat.seat_number} · ${seat.class}${seat.extra_fee > 0 ? ` · +${formatPrice(seat.extra_fee)}` : ''}`,
                                    })}
                                    onMouseLeave={() => setTooltip(null)}
                                    className={cn(
                                      'w-8 h-8 rounded-md text-[10px] font-bold flex items-center justify-center border transition-all duration-150',
                                      seatClass
                                    )}
                                    aria-label={`Seat ${seat.seat_number} ${cls} ${isOccupied ? 'occupied' : 'available'}`}
                                  >
                                    {seat.seat_number.replace(/\d+/, '')}
                                  </button>

                                  {/* Tooltip */}
                                  {tooltip?.id === seat.id && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-10
                                      bg-sky-900 border border-sky-600/50 rounded-lg px-2.5 py-1.5
                                      text-xs text-sky-200 whitespace-nowrap shadow-xl pointer-events-none">
                                      {tooltip.text}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                                        border-l-4 border-r-4 border-t-4 border-transparent border-t-sky-900" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Class price info */}
                {clsSeats[0] && clsSeats[0].extra_fee > 0 && (
                  <p className="text-xs text-sky-300/50 mt-2">
                    +{formatPrice(clsSeats[0].extra_fee)} per seat
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected seat summary */}
      {selectedSeat && (
        <div className="glass-strong rounded-xl p-4 border border-sky-500/30 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-sky-300/60 uppercase tracking-wider mb-0.5">Selected Seat</p>
              <p className="font-bold text-white text-lg">{selectedSeat.seat_number}</p>
              <p className="text-sm text-sky-300/70 capitalize">{selectedSeat.class} class</p>
            </div>
            {selectedSeat.extra_fee > 0 && (
              <div className="text-right">
                <p className="text-xs text-sky-300/60">Extra fee</p>
                <p className="font-bold text-yellow-400">+{formatPrice(selectedSeat.extra_fee)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
