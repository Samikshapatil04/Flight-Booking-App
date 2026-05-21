import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Booking } from '@/types';
import type { Session } from '@supabase/supabase-js';

interface UserStore {
  session: Session | null;
  setSession: (session: Session | null) => void;

  cachedBookings: Booking[];
  setCachedBookings: (bookings: Booking[]) => void;
  addCachedBooking: (booking: Booking) => void;
  updateCachedBooking: (id: string, updates: Partial<Booking>) => void;

  resetUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),

      cachedBookings: [],
      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),
      addCachedBooking: (booking) =>
        set((state) => ({
          cachedBookings: [booking, ...state.cachedBookings],
        })),
      updateCachedBooking: (id, updates) =>
        set((state) => ({
          cachedBookings: state.cachedBookings.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      resetUser: () =>
        set({
          session: null,
          cachedBookings: [],
        }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      // Persist only session token (not full booking details for privacy)
      partialize: (state) => ({
        session: state.session
          ? { access_token: state.session.access_token, refresh_token: state.session.refresh_token }
          : null,
        cachedBookings: state.cachedBookings,
      }),
    }
  )
);
