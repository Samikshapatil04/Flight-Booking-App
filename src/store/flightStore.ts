import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Flight, Seat, FlightSearchParams, PassengerFormData, BookingStep, SeatClass } from '@/types';

interface FlightStore {
  // Search
  searchQuery: FlightSearchParams | null;
  setSearchQuery: (query: FlightSearchParams) => void;

  // Selected flight & seat
  selectedFlight: Flight | null;
  setSelectedFlight: (flight: Flight | null) => void;

  selectedSeat: Seat | null;
  setSelectedSeat: (seat: Seat | null) => void;

  // Optimistic seat selection (before Supabase confirms)
  optimisticSeatId: string | null;
  setOptimisticSeatId: (id: string | null) => void;

  // Booking step
  currentStep: BookingStep;
  setCurrentStep: (step: BookingStep) => void;

  // Passenger form (passport_no excluded from persistence via partialize)
  passengerData: PassengerFormData | null;
  setPassengerData: (data: PassengerFormData | null) => void;

  // Selected class filter
  selectedClass: SeatClass;
  setSelectedClass: (cls: SeatClass) => void;

  // Reset
  resetBooking: () => void;
  resetAll: () => void;
}

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      searchQuery: null,
      setSearchQuery: (query) => set({ searchQuery: query }),

      selectedFlight: null,
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),

      selectedSeat: null,
      setSelectedSeat: (seat) => set({ selectedSeat: seat }),

      optimisticSeatId: null,
      setOptimisticSeatId: (id) => set({ optimisticSeatId: id }),

      currentStep: 'search',
      setCurrentStep: (step) => set({ currentStep: step }),

      passengerData: null,
      setPassengerData: (data) => set({ passengerData: data }),

      selectedClass: 'economy',
      setSelectedClass: (cls) => set({ selectedClass: cls }),

      resetBooking: () =>
        set({
          selectedFlight: null,
          selectedSeat: null,
          optimisticSeatId: null,
          currentStep: 'search',
          passengerData: null,
        }),

      resetAll: () =>
        set({
          searchQuery: null,
          selectedFlight: null,
          selectedSeat: null,
          optimisticSeatId: null,
          currentStep: 'search',
          passengerData: null,
          selectedClass: 'economy',
        }),
    }),
    {
      name: 'flight-store',
      storage: createJSONStorage(() => localStorage),
      // Exclude passport_no from persistence for security
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        currentStep: state.currentStep,
        selectedClass: state.selectedClass,
        // Persist passenger data but strip passport number
        passengerData: state.passengerData
          ? {
              full_name: state.passengerData.full_name,
              nationality: state.passengerData.nationality,
              dob: state.passengerData.dob,
              passport_no: '', // Never persist passport number
            }
          : null,
      }),
    }
  )
);
