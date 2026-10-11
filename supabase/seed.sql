-- ==============================================================================
-- TravelMate Development Seed Script
-- ==============================================================================
-- Description:
--   Seeds a sample curated expedition (Kyoto Autumn) for local development
--   or testing.
--
-- Usage:
--   1. Replace '<YOUR_USER_UUID>' with your authenticated user's ID
--      (found in auth.users or profiles table).
--   2. Run this script in the Supabase SQL Editor or via CLI:
--      supabase db query -f supabase/seed.sql
-- ==============================================================================

DO $$
DECLARE
  v_user_id UUID := '<YOUR_USER_UUID>'; -- <-- Replace with your target auth.users id
  v_trip_id UUID;
  v_dest_kyoto UUID;
  v_dest_tokyo UUID;
  v_act_1 UUID;
  v_act_2 UUID;
BEGIN
  -- Verify user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE NOTICE 'Please replace <YOUR_USER_UUID> with a real user UUID before executing seed script.';
    RETURN;
  END IF;

  -- 1. Insert Trip
  INSERT INTO public.trips (
    user_id,
    title,
    description,
    start_date,
    end_date,
    budget_amount,
    currency,
    is_bookmarked
  ) VALUES (
    v_user_id,
    'Kyoto & Tokyo Autumn Discovery',
    'Curated cultural expedition across temples, autumn foliage, and transit corridors.',
    '2026-10-12',
    '2026-10-19',
    3200.00,
    'USD',
    true
  )
  RETURNING id INTO v_trip_id;

  -- 2. Insert Destinations
  INSERT INTO public.destinations (
    trip_id,
    name,
    country,
    arrival_date,
    departure_date,
    latitude,
    longitude,
    display_order
  ) VALUES (
    v_trip_id,
    'Kyoto',
    'Japan',
    '2026-10-12',
    '2026-10-16',
    35.0116,
    135.7681,
    1
  ) RETURNING id INTO v_dest_kyoto;

  INSERT INTO public.destinations (
    trip_id,
    name,
    country,
    arrival_date,
    departure_date,
    latitude,
    longitude,
    display_order
  ) VALUES (
    v_trip_id,
    'Tokyo',
    'Japan',
    '2026-10-16',
    '2026-10-19',
    35.6762,
    139.6503,
    2
  ) RETURNING id INTO v_dest_tokyo;

  -- 3. Insert Itinerary Items
  INSERT INTO public.itinerary_items (
    trip_id,
    destination_id,
    title,
    notes,
    activity_date,
    start_time,
    end_time,
    cost_amount,
    category
  ) VALUES (
    v_trip_id,
    v_dest_kyoto,
    'Fushimi Inari Shrine Morning Walk',
    'Hike the Senbon Torii gates early morning before peak crowds.',
    '2026-10-13',
    '08:00',
    '11:00',
    0.00,
    'activity'
  ) RETURNING id INTO v_act_1;

  INSERT INTO public.itinerary_items (
    trip_id,
    v_dest_kyoto,
    'Gion Traditional Kaiseki Dinner',
    'Seven-course autumn tasting menu in historic teahouse.',
    '2026-10-13',
    '18:30',
    '20:30',
    120.00,
    'dining'
  ) RETURNING id INTO v_act_2;

  -- 4. Insert Expenses
  INSERT INTO public.expenses (
    trip_id,
    activity_id,
    title,
    amount,
    category,
    payment_status,
    expense_date,
    notes
  ) VALUES
    (v_trip_id, NULL, 'Kansai Express Shinkansen', 140.00, 'transport', 'paid', '2026-10-12', 'Bullet train tickets booked via SmartEX'),
    (v_trip_id, v_act_2, 'Kaiseki Dinner Reservation', 120.00, 'dining', 'paid', '2026-10-13', 'Gion restaurant');

  RAISE NOTICE 'Sample expedition seeded successfully with Trip ID %', v_trip_id;
END $$;
