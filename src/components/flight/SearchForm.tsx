'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Users, ArrowLeftRight, Search } from 'lucide-react';
import { useFlightStore } from '@/store/flightStore';
import { INDIAN_CITIES } from '@/lib/utils';
import type { SeatClass } from '@/types';

export default function SearchForm() {
  const router = useRouter();
  const { searchQuery, setSearchQuery, setCurrentStep } = useFlightStore();

  const [form, setForm] = useState({
    origin: searchQuery?.origin ?? '',
    destination: searchQuery?.destination ?? '',
    date: searchQuery?.date ?? new Date().toISOString().split('T')[0],
    passengers: searchQuery?.passengers ?? 1,
    class: (searchQuery?.class ?? 'economy') as SeatClass,
  });

  const swap = () => {
    setForm((f) => ({ ...f, origin: f.destination, destination: f.origin }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.origin || !form.destination || form.origin === form.destination) return;
    setSearchQuery(form);
    setCurrentStep('results');
    const params = new URLSearchParams({
      origin: form.origin,
      destination: form.destination,
      date: form.date,
      passengers: String(form.passengers),
      class: form.class,
    });
    router.push(`/search?${params.toString()}`);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Origin / Destination row */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-sky-300/70 font-medium uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3" /> From
          </label>
          <select
            required
            value={form.origin}
            onChange={(e) => setForm({ ...form, origin: e.target.value })}
            className="input-field"
          >
            <option value="">Select origin</option>
            {INDIAN_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={swap}
          title="Swap cities"
          className="mt-5 p-2.5 rounded-xl bg-sky-700/30 hover:bg-sky-600/50 text-sky-300
            transition-all duration-200 active:scale-90"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        <div className="flex-1 space-y-1">
          <label className="text-xs text-sky-300/70 font-medium uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3" /> To
          </label>
          <select
            required
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            className="input-field"
          >
            <option value="">Select destination</option>
            {INDIAN_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Date / Passengers / Class row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-sky-300/70 font-medium uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Date
          </label>
          <input
            type="date"
            required
            min={todayStr}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="input-field"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-sky-300/70 font-medium uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3" /> Passengers
          </label>
          <select
            value={form.passengers}
            onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })}
            className="input-field"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-sky-300/70 font-medium uppercase tracking-wider">
            Class
          </label>
          <select
            value={form.class}
            onChange={(e) => setForm({ ...form, class: e.target.value as SeatClass })}
            className="input-field"
          >
            <option value="economy">Economy</option>
            <option value="business">Business</option>
            <option value="first">First Class</option>
          </select>
        </div>
      </div>

      {/* Submit */}
      <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-base">
        <Search className="w-5 h-5" />
        Search Flights
      </button>
    </form>
  );
}
