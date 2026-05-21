-- ============================================================
-- Migration: 001_initial_schema.sql
-- Description: Create all tables, RLS policies, functions, triggers
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: flights
-- ============================================================
CREATE TABLE IF NOT EXISTS public.flights (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_no     TEXT NOT NULL UNIQUE,
  origin        TEXT NOT NULL,
  destination   TEXT NOT NULL,
  departs_at    TIMESTAMPTZ NOT NULL,
  arrives_at    TIMESTAMPTZ NOT NULL,
  aircraft_type TEXT NOT NULL DEFAULT 'Boeing 737',
  status        TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed')),
  base_price    NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: seats
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seats (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_id     UUID NOT NULL REFERENCES public.flights(id) ON DELETE CASCADE,
  seat_number   TEXT NOT NULL,
  class         TEXT NOT NULL CHECK (class IN ('economy', 'business', 'first')),
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  extra_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(flight_id, seat_number)
);

-- ============================================================
-- TABLE: bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id   UUID NOT NULL REFERENCES public.flights(id),
  seat_id     UUID NOT NULL REFERENCES public.seats(id),
  status      TEXT NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('confirmed', 'rescheduled', 'cancelled', 'pending')),
  booked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  pnr_code    TEXT NOT NULL UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: passengers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.passengers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  passport_no  TEXT NOT NULL,
  nationality  TEXT NOT NULL,
  dob          DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: reschedules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reschedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  old_flight_id UUID NOT NULL REFERENCES public.flights(id),
  new_flight_id UUID NOT NULL REFERENCES public.flights(id),
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fee_charged   NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_flights_origin_dest ON public.flights(origin, destination);
CREATE INDEX idx_flights_departs_at ON public.flights(departs_at);
CREATE INDEX idx_seats_flight_id ON public.seats(flight_id);
CREATE INDEX idx_seats_available ON public.seats(flight_id, is_available);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_flight_id ON public.bookings(flight_id);
CREATE INDEX idx_passengers_booking_id ON public.passengers(booking_id);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.flights    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reschedules ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: flights (public read)
-- ============================================================
CREATE POLICY "Anyone can view flights"
  ON public.flights FOR SELECT
  USING (TRUE);

-- ============================================================
-- RLS POLICIES: seats (public read)
-- ============================================================
CREATE POLICY "Anyone can view seats"
  ON public.seats FOR SELECT
  USING (TRUE);

-- ============================================================
-- RLS POLICIES: bookings (users see only their own)
-- ============================================================
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: passengers
-- ============================================================
CREATE POLICY "Users can view own passengers"
  ON public.passengers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own passengers"
  ON public.passengers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND b.user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES: reschedules
-- ============================================================
CREATE POLICY "Users can view own reschedules"
  ON public.reschedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own reschedules"
  ON public.reschedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id AND b.user_id = auth.uid()
    )
  );

-- ============================================================
-- DB-LEVEL TRIGGER: Block cancellations within 2 hours of departure
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_cancellation_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_departs_at TIMESTAMPTZ;
BEGIN
  -- Only fire on cancellation status changes
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    SELECT f.departs_at INTO v_departs_at
    FROM public.flights f
    WHERE f.id = NEW.flight_id;

    IF v_departs_at IS NOT NULL AND v_departs_at - NOW() < INTERVAL '2 hours' THEN
      RAISE EXCEPTION 'Cancellation not allowed within 2 hours of departure. Flight departs at %', v_departs_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_cancellation_window
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_cancellation_window();

-- ============================================================
-- RPC FUNCTION: reserve_seat (atomic seat locking, prevents double-booking)
-- ============================================================
CREATE OR REPLACE FUNCTION public.reserve_seat(
  p_flight_id  UUID,
  p_seat_id    UUID,
  p_user_id    UUID,
  p_total_price NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seat_available  BOOLEAN;
  v_booking_id      UUID;
  v_pnr             TEXT;
BEGIN
  -- Lock the seat row for update (prevents race conditions)
  SELECT is_available INTO v_seat_available
  FROM public.seats
  WHERE id = p_seat_id AND flight_id = p_flight_id
  FOR UPDATE;

  IF v_seat_available IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Seat not found');
  END IF;

  IF NOT v_seat_available THEN
    RETURN json_build_object('success', false, 'error', 'Seat is no longer available');
  END IF;

  -- Mark seat as unavailable
  UPDATE public.seats
  SET is_available = FALSE
  WHERE id = p_seat_id;

  -- Generate unique PNR
  v_pnr := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  -- Create booking
  INSERT INTO public.bookings (user_id, flight_id, seat_id, total_price, pnr_code, status)
  VALUES (p_user_id, p_flight_id, p_seat_id, p_total_price, v_pnr, 'confirmed')
  RETURNING id INTO v_booking_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'pnr_code', v_pnr
  );
END;
$$;

-- ============================================================
-- RPC FUNCTION: cancel_booking (atomic cancel + seat release)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id UUID,
  p_user_id    UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking   RECORD;
  v_departs_at TIMESTAMPTZ;
BEGIN
  -- Get booking with FOR UPDATE to lock
  SELECT b.*, f.departs_at INTO v_booking
  FROM public.bookings b
  JOIN public.flights f ON f.id = b.flight_id
  WHERE b.id = p_booking_id AND b.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Booking already cancelled');
  END IF;

  -- 2-hour rule check
  IF v_booking.departs_at - NOW() < INTERVAL '2 hours' THEN
    RETURN json_build_object('success', false, 'error', 'Cancellation not allowed within 2 hours of departure');
  END IF;

  -- Update booking status
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;

  -- Release the seat
  UPDATE public.seats
  SET is_available = TRUE
  WHERE id = v_booking.seat_id;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC FUNCTION: reschedule_booking
-- ============================================================
CREATE OR REPLACE FUNCTION public.reschedule_booking(
  p_booking_id     UUID,
  p_new_flight_id  UUID,
  p_new_seat_id    UUID,
  p_user_id        UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking         RECORD;
  v_new_flight      RECORD;
  v_new_seat        RECORD;
  v_old_seat_id     UUID;
  v_fee             NUMERIC := 0;
  v_new_total       NUMERIC;
BEGIN
  -- Lock current booking
  SELECT b.*, f.base_price AS old_price, f.departs_at AS old_departs
  INTO v_booking
  FROM public.bookings b
  JOIN public.flights f ON f.id = b.flight_id
  WHERE b.id = p_booking_id AND b.user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot reschedule a cancelled booking');
  END IF;

  -- Get new flight
  SELECT * INTO v_new_flight FROM public.flights WHERE id = p_new_flight_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'New flight not found');
  END IF;

  -- Lock new seat
  SELECT * INTO v_new_seat FROM public.seats
  WHERE id = p_new_seat_id AND flight_id = p_new_flight_id
  FOR UPDATE;

  IF NOT FOUND OR NOT v_new_seat.is_available THEN
    RETURN json_build_object('success', false, 'error', 'New seat not available');
  END IF;

  -- Calculate fee
  v_new_total := v_new_flight.base_price + v_new_seat.extra_fee;
  IF v_new_total > v_booking.total_price THEN
    v_fee := v_new_total - v_booking.total_price;
  END IF;

  v_old_seat_id := v_booking.seat_id;

  -- Release old seat
  UPDATE public.seats SET is_available = TRUE WHERE id = v_old_seat_id;

  -- Lock new seat
  UPDATE public.seats SET is_available = FALSE WHERE id = p_new_seat_id;

  -- Update booking
  UPDATE public.bookings
  SET flight_id = p_new_flight_id,
      seat_id   = p_new_seat_id,
      status    = 'rescheduled',
      total_price = v_new_total
  WHERE id = p_booking_id;

  -- Record reschedule
  INSERT INTO public.reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
  VALUES (p_booking_id, v_booking.flight_id, p_new_flight_id, v_fee);

  RETURN json_build_object(
    'success', true,
    'fee_charged', v_fee,
    'new_total', v_new_total
  );
END;
$$;
