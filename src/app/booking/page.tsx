'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, ChevronRight, Check, User, CreditCard } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import SeatMap from '@/components/seat/SeatMap';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { useFlightStore } from '@/store/flightStore';
import { useUserStore } from '@/store/userStore';
import { createClient } from '@/lib/supabase/client';
import { formatPrice, formatDateTime, flightDuration, NATIONALITIES, cn } from '@/lib/utils';
import type { PassengerFormData } from '@/types';

const STEPS = ['Seat', 'Passengers', 'Confirm'];

function BookingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flightId = searchParams.get('flightId');
  const { showToast } = useToast();

  const {
    selectedFlight, setSelectedFlight,
    selectedSeat,
    passengerData, setPassengerData,
    currentStep, setCurrentStep,
    selectedClass,
    resetBooking,
  } = useFlightStore();
  const { session } = useUserStore();

  const [stepIndex, setStepIndex] = useState(0); // 0=seat, 1=passengers, 2=confirm
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<PassengerFormData>({
    full_name: passengerData?.full_name ?? '',
    passport_no: '',
    nationality: passengerData?.nationality ?? '',
    dob: passengerData?.dob ?? '',
  });

  // Load flight if not in store
  useEffect(() => {
    if (!selectedFlight && flightId) {
      const supabase = createClient();
      supabase.from('flights').select('*').eq('id', flightId).single()
        .then(({ data }) => { if (data) setSelectedFlight(data); });
    }
  }, [flightId, selectedFlight, setSelectedFlight]);

  if (!selectedFlight) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalPrice = selectedFlight.base_price +
    (selectedSeat?.extra_fee ?? 0) *
    (selectedClass === 'business' ? 1 : selectedClass === 'first' ? 1 : 1);

  const handlePassengerNext = (e: React.FormEvent) => {
    e.preventDefault();
    setPassengerData(form);
    setStepIndex(2);
  };

  const handleConfirm = async () => {
    if (!selectedSeat || !session) {
      showToast('Please sign in to book', 'error');
      router.push('/login');
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Reserve seat via RPC
      const { data: reserveData, error: reserveError } = await supabase.rpc('reserve_seat', {
        p_flight_id: selectedFlight.id,
        p_seat_id: selectedSeat.id,
        p_user_id: user.id,
        p_total_price: totalPrice,
      });

      if (reserveError || !reserveData?.success) {
        showToast(reserveData?.error ?? reserveError?.message ?? 'Booking failed', 'error');
        setSubmitting(false);
        return;
      }

      // Insert passenger details
      await supabase.from('passengers').insert({
        booking_id: reserveData.booking_id,
        full_name: form.full_name,
        passport_no: form.passport_no,
        nationality: form.nationality,
        dob: form.dob,
      });

      resetBooking();
      router.push(`/confirmation?bookingId=${reserveData.booking_id}&pnr=${reserveData.pnr_code}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200',
              i < stepIndex ? 'bg-emerald-500 text-white' :
              i === stepIndex ? 'bg-sky-600 text-white ring-4 ring-sky-600/30' :
              'glass text-sky-300/40'
            )}>
              {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn('text-sm font-medium hidden sm:block',
              i === stepIndex ? 'text-white' : 'text-sky-300/40'
            )}>{s}</span>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-sky-700/50 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Flight summary */}
      <div className="glass rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600/30 flex items-center justify-center shrink-0">
            <Plane className="w-5 h-5 text-sky-400 -rotate-45" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white">{selectedFlight.flight_no}</span>
              <span className="text-sky-300/60 text-sm">{selectedFlight.origin} → {selectedFlight.destination}</span>
            </div>
            <p className="text-xs text-sky-300/50 mt-0.5">
              {formatDateTime(selectedFlight.departs_at)} · {flightDuration(selectedFlight.departs_at, selectedFlight.arrives_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-white">{formatPrice(totalPrice)}</p>
            {selectedSeat && (
              <p className="text-xs text-sky-300/60">Seat {selectedSeat.seat_number}</p>
            )}
          </div>
        </div>
      </div>

      {/* Step 0: Seat selection */}
      {stepIndex === 0 && (
        <div className="card">
          <h2 className="font-display text-xl font-bold text-white mb-5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-sky-600/30 flex items-center justify-center text-sm">1</span>
            Select Your Seat
          </h2>
          <SeatMap flightId={selectedFlight.id} />
          <button
            onClick={() => {
              if (!selectedSeat) { showToast('Please select a seat', 'warning'); return; }
              setStepIndex(1);
            }}
            className="w-full btn-primary mt-6"
          >
            Continue to Passenger Details
          </button>
        </div>
      )}

      {/* Step 1: Passenger details */}
      {stepIndex === 1 && (
        <div className="card">
          <h2 className="font-display text-xl font-bold text-white mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-sky-400" />
            Passenger Details
          </h2>
          <form onSubmit={handlePassengerNext} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-sky-300/70 uppercase tracking-wider">Full Name</label>
              <input
                required
                type="text"
                placeholder="As on passport"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-sky-300/70 uppercase tracking-wider">Passport Number</label>
              <input
                required
                type="text"
                placeholder="e.g. A1234567"
                value={form.passport_no}
                onChange={(e) => setForm({ ...form, passport_no: e.target.value.toUpperCase() })}
                className="input-field font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-sky-300/70 uppercase tracking-wider">Nationality</label>
                <select
                  required
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select</option>
                  {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-sky-300/70 uppercase tracking-wider">Date of Birth</label>
                <input
                  required
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStepIndex(0)} className="btn-secondary flex-1">
                Back
              </button>
              <button type="submit" className="btn-primary flex-1">
                Review Booking
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Confirm */}
      {stepIndex === 2 && (
        <div className="card">
          <h2 className="font-display text-xl font-bold text-white mb-5 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-sky-400" />
            Review & Confirm
          </h2>

          <div className="space-y-4 mb-6">
            <div className="glass rounded-xl p-4 space-y-2">
              <p className="text-xs text-sky-300/50 uppercase tracking-wider mb-3">Passenger</p>
              {[
                { label: 'Name', value: form.full_name },
                { label: 'Passport', value: form.passport_no },
                { label: 'Nationality', value: form.nationality },
                { label: 'DOB', value: new Date(form.dob).toLocaleDateString('en-IN') },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-sky-300/60">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="glass rounded-xl p-4 space-y-2">
              <p className="text-xs text-sky-300/50 uppercase tracking-wider mb-3">Booking Summary</p>
              {[
                { label: 'Flight', value: selectedFlight.flight_no },
                { label: 'Route', value: `${selectedFlight.origin} → ${selectedFlight.destination}` },
                { label: 'Seat', value: `${selectedSeat?.seat_number ?? '—'} (${selectedSeat?.class ?? ''})` },
                { label: 'Base Price', value: formatPrice(selectedFlight.base_price) },
                ...(selectedSeat?.extra_fee ? [{ label: 'Seat Fee', value: formatPrice(selectedSeat.extra_fee) }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-sky-300/60">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                <span className="text-sky-300">Total</span>
                <span className="text-white text-lg">{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStepIndex(1)} className="btn-secondary flex-1">
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="btn-primary flex-1"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Booking…
                </span>
              ) : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-sky-950">
        <Navbar />
        <BookingInner />
      </div>
    </ToastProvider>
  );
}
