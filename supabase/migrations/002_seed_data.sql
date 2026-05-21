-- ============================================================
-- Migration: 002_seed_data.sql
-- Fixed future dates so flights always appear in search
-- ============================================================

-- Clean up helper function if it exists
DROP FUNCTION IF EXISTS seed_seats_for_flight(UUID);

-- Remove existing seed data if re-running
DELETE FROM public.seats WHERE flight_id IN (
  SELECT id FROM public.flights WHERE flight_no LIKE 'SA%'
);
DELETE FROM public.flights WHERE flight_no LIKE 'SA%';

-- ============================================================
-- SEED FLIGHTS (8 flights across 4 routes)
-- Using fixed dates 30-60 days from a known future date
-- ============================================================
INSERT INTO public.flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price) VALUES

-- Route 1: Delhi <-> Mumbai
('a1b2c3d4-0001-0001-0001-000000000001', 'SA101', 'Delhi', 'Mumbai',
  '2026-07-01 08:00:00+05:30', '2026-07-01 10:05:00+05:30', 'Airbus A320', 'scheduled', 4500.00),

('a1b2c3d4-0001-0001-0001-000000000002', 'SA102', 'Mumbai', 'Delhi',
  '2026-07-01 14:00:00+05:30', '2026-07-01 16:05:00+05:30', 'Airbus A320', 'scheduled', 4200.00),

-- Route 2: Bengaluru <-> Hyderabad
('a1b2c3d4-0001-0001-0001-000000000003', 'SA201', 'Bengaluru', 'Hyderabad',
  '2026-07-02 06:30:00+05:30', '2026-07-02 07:40:00+05:30', 'Boeing 737', 'scheduled', 3200.00),

('a1b2c3d4-0001-0001-0001-000000000004', 'SA202', 'Hyderabad', 'Bengaluru',
  '2026-07-02 12:00:00+05:30', '2026-07-02 13:10:00+05:30', 'Boeing 737', 'scheduled', 3000.00),

-- Route 3: Chennai <-> Kolkata
('a1b2c3d4-0001-0001-0001-000000000005', 'SA301', 'Chennai', 'Kolkata',
  '2026-07-03 07:00:00+05:30', '2026-07-03 09:30:00+05:30', 'Airbus A321', 'scheduled', 5500.00),

('a1b2c3d4-0001-0001-0001-000000000006', 'SA302', 'Kolkata', 'Chennai',
  '2026-07-03 15:00:00+05:30', '2026-07-03 17:30:00+05:30', 'Airbus A321', 'scheduled', 5200.00),

-- Route 4: Delhi <-> Bengaluru
('a1b2c3d4-0001-0001-0001-000000000007', 'SA401', 'Delhi', 'Bengaluru',
  '2026-07-04 09:00:00+05:30', '2026-07-04 11:45:00+05:30', 'Boeing 737 MAX', 'scheduled', 6800.00),

('a1b2c3d4-0001-0001-0001-000000000008', 'SA402', 'Bengaluru', 'Delhi',
  '2026-07-04 16:00:00+05:30', '2026-07-04 18:45:00+05:30', 'Boeing 737 MAX', 'scheduled', 6500.00);

-- ============================================================
-- SEED SEATS for each flight
-- First class: rows 1-2 (4 seats/row)
-- Business: rows 3-6 (4 seats/row)
-- Economy: rows 7-30 (6 seats/row)
-- ============================================================
CREATE OR REPLACE FUNCTION seed_seats_for_flight(p_flight_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  r INT;
  col TEXT;
  first_cols TEXT[] := ARRAY['A','B','C','D'];
  biz_cols   TEXT[] := ARRAY['A','B','C','D'];
  eco_cols   TEXT[] := ARRAY['A','B','C','D','E','F'];
BEGIN
  FOREACH col IN ARRAY first_cols LOOP
    FOR r IN 1..2 LOOP
      INSERT INTO public.seats (flight_id, seat_number, class, is_available, extra_fee)
      VALUES (p_flight_id, r || col, 'first', TRUE, 8000.00)
      ON CONFLICT (flight_id, seat_number) DO NOTHING;
    END LOOP;
  END LOOP;

  FOREACH col IN ARRAY biz_cols LOOP
    FOR r IN 3..6 LOOP
      INSERT INTO public.seats (flight_id, seat_number, class, is_available, extra_fee)
      VALUES (p_flight_id, r || col, 'business', TRUE, 3500.00)
      ON CONFLICT (flight_id, seat_number) DO NOTHING;
    END LOOP;
  END LOOP;

  FOREACH col IN ARRAY eco_cols LOOP
    FOR r IN 7..30 LOOP
      INSERT INTO public.seats (flight_id, seat_number, class, is_available, extra_fee)
      VALUES (p_flight_id, r || col, 'economy', TRUE, 0.00)
      ON CONFLICT (flight_id, seat_number) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

SELECT seed_seats_for_flight('a1b2c3d4-0001-0001-0001-000000000001');
SELECT seed_seats_for_flight('a1b2c3d4-0001-0001-0001-000000000002');
SELECT seed_seats_for_flight('a1b2c3d4-0001-0001-0001-000000000003');
SELECT seed_seats_for_flight('a1b2c3d4-0001-0001-0001-000000000004');
SELECT seed_seats_for_flight('a1b2c3d4-0001-0001-0001-000000000005');
SELECT seed_seats_for_flight('a1b2c3d4-0001-0001-0001-000000000006');
SELECT seed_seats_for_flight('a1b2c3d4-0001-0001-0001-000000000007');
SELECT seed_seats_for_flight('a1b2c3d4-0001-0001-0001-000000000008');

DROP FUNCTION seed_seats_for_flight(UUID);

-- Mark some seats as occupied for realism
UPDATE public.seats SET is_available = FALSE
WHERE flight_id = 'a1b2c3d4-0001-0001-0001-000000000001'
  AND seat_number IN ('7A','7B','8C','9D','10E','10F','12A','15B','20C','22D');

UPDATE public.seats SET is_available = FALSE
WHERE flight_id = 'a1b2c3d4-0001-0001-0001-000000000003'
  AND seat_number IN ('7C','8A','9B','11D','13E','14F','17A','18B');

-- Verify
SELECT flight_no, origin, destination, departs_at::date AS date, base_price FROM public.flights ORDER BY departs_at;