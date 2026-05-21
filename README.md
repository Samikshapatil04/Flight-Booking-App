# ✈️ SkyWave — Flight Management PWA

A production-grade flight booking web app built with **Next.js 14**, **Supabase**, **Zustand**, and **Tailwind CSS**.

---

## 🚀 Features

- **Flight Search** — Search by origin, destination, date, class, and passenger count
- **Seat Selection** — Visual aircraft cabin map with real-time availability via Supabase Realtime
- **Booking Flow** — 3-step flow: Seat → Passenger Details → Confirm
- **My Bookings** — Manage all bookings with status badges
- **Reschedule** — Pick alternative flight + seat, auto-charge fare difference
- **Cancel** — Atomic cancellation + seat release; DB-enforced 2-hour rule
- **PWA** — Installable, offline-capable with service worker caching
- **Auth** — Supabase Auth with Row Level Security on all tables

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database & Auth | Supabase (PostgreSQL + Auth + Realtime) |
| State Management | Zustand with persist middleware |
| Styling | Tailwind CSS |
| PWA | next-pwa |
| Language | TypeScript (strict) |
| Deployment | Vercel |

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/skywave-flight-app.git
cd skywave-flight-app
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **anon key** from Settings → API

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run database migrations

In the Supabase dashboard → **SQL Editor**, run the two migration files in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_seed_data.sql
```

Or using the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### 5. Create test user

In Supabase Dashboard → Authentication → Users → Add user:

```
Email:    test@skywave.dev
Password: Test@1234
```

Or sign up on the `/register` page.

### 6. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🏗 Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Home / hero page
│   ├── search/                 # Flight search & results
│   ├── booking/                # Booking flow (seat → pax → confirm)
│   ├── confirmation/           # Post-booking PNR page
│   ├── my-bookings/            # Booking management
│   │   └── [bookingId]/        # Reschedule sub-route
│   ├── login/                  # Auth pages
│   ├── register/
│   └── offline/                # PWA offline fallback
│
├── components/
│   ├── layout/Navbar.tsx
│   ├── flight/
│   │   ├── FlightCard.tsx      # Search result card
│   │   └── SearchForm.tsx      # Origin/dest/date/class form
│   ├── seat/SeatMap.tsx        # Interactive cabin grid + Realtime
│   ├── booking/BookingCard.tsx # My bookings list item
│   └── ui/
│       ├── Toast.tsx           # Toast notification system
│       ├── ConfirmDialog.tsx   # Confirmation modal
│       ├── Skeleton.tsx        # Loading skeletons
│       └── InstallPrompt.tsx   # PWA install banner
│
├── store/
│   ├── flightStore.ts          # Search/booking state + partialize
│   └── userStore.ts            # Auth session + cached bookings
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server component client
│   │   └── middleware.ts       # Auth session refresh
│   └── utils.ts                # Date, price, class helpers
│
└── types/index.ts              # All TypeScript types
```

---

## 🗄 Database Schema

```
flights      → id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price
seats        → id, flight_id, seat_number, class, is_available, extra_fee
bookings     → id, user_id, flight_id, seat_id, status, booked_at, total_price, pnr_code
passengers   → id, booking_id, full_name, passport_no, nationality, dob
reschedules  → id, booking_id, old_flight_id, new_flight_id, requested_at, fee_charged
```

### RLS Policies
- `flights`, `seats` — public read (anyone can search)
- `bookings`, `passengers`, `reschedules` — users access only their own rows (`auth.uid() = user_id`)

### RPC Functions
| Function | Purpose |
|---|---|
| `reserve_seat(flight_id, seat_id, user_id, total_price)` | Atomic seat lock + booking insert; prevents race conditions using `FOR UPDATE` row lock |
| `cancel_booking(booking_id, user_id)` | Atomic cancel + seat release in one transaction |
| `reschedule_booking(booking_id, new_flight_id, new_seat_id, user_id)` | Swap flight & seat atomically, calculate fare difference |

### DB-Level Constraint
A trigger `trg_enforce_cancellation_window` on the `bookings` table raises an exception if a cancellation is attempted within **2 hours of departure** — enforced at the database level, not just the application layer.

---

## 🧠 Zustand Store Architecture

### `useFlightStore` (persisted)
```ts
{
  searchQuery,        // Persisted — resume search after tab close
  selectedFlight,     // Persisted — resume in-progress booking
  selectedSeat,       // Persisted
  optimisticSeatId,   // NOT persisted — UI-only optimistic state
  currentStep,        // Persisted — resume booking step
  passengerData,      // Persisted BUT passport_no stripped via partialize
  selectedClass,      // Persisted
}
```

**`partialize`** excludes `passport_no` from localStorage — sensitive document numbers never touch browser storage.

### `useUserStore` (persisted)
```ts
{
  session,          // Only access_token + refresh_token persisted
  cachedBookings,   // Persisted for offline reading
}
```

---

## 📱 PWA Configuration

- **Manifest**: `/public/manifest.json` — name, icons (192×192, 512×512), `display: standalone`
- **Caching strategies**:
  - `StaleWhileRevalidate` — Supabase flight search API calls
  - `CacheFirst` — `/_next/static/**` and image assets
- **Offline fallback**: `/offline` page shown when network unavailable
- **My Bookings offline**: Last-cached data from Zustand persisted store
- **Install prompt**: Banner shown to first-time mobile visitors

---

## 🚢 Deployment to Vercel

### Option A — Vercel Dashboard (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select repo
3. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
4. Click Deploy

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 🧪 Test Credentials

```
Email:    test@skywave.dev
Password: Test@1234
```

(Create this user in Supabase Auth dashboard before testing)

---

## ⚠️ Trade-offs & Known Limitations

- **Payment**: No real payment gateway — total price is calculated and stored but no Stripe/Razorpay integration
- **Multi-passenger**: UI supports 1 passenger per booking; multi-pax requires iterating the passenger insert loop
- **PWA icons**: Placeholder SVG icons used; replace `/public/icons/icon-192x192.png` and `/public/icons/icon-512x512.png` with real PNGs for Lighthouse PWA score
- **Email confirmation**: Supabase sends a confirmation email on signup; for testing, disable "Email Confirm" in Supabase Auth settings

---

## 📊 Architecture Decisions

1. **Server Components for data fetching** — Search results, confirmation, and My Bookings pages use Next.js Server Components with the Supabase server client, keeping API keys server-side
2. **RPC for mutations** — All seat reservations, cancellations, and reschedules go through Supabase RPC functions with `FOR UPDATE` locks to prevent race conditions
3. **Optimistic UI** — Seat selection updates the store immediately before Supabase confirms, giving instant visual feedback
4. **partialize for security** — Zustand's `partialize` config strips `passport_no` before writing to localStorage, ensuring PII never enters browser storage

---

*Built for Source Asia Frontend Internship Technical Assignment — May 2026*
