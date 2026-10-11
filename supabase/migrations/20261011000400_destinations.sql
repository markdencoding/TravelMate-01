-- ==============================================================================
-- Migration: 20261011000400_destinations.sql
-- Description: Trip destinations table, geographical coordinate constraints,
--              composite unique key for safe child FKs, indexes, and RLS.
-- ==============================================================================

-- 1. Destinations Table
create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  country text not null default '',
  latitude numeric(9, 6) check (latitude is null or (latitude between -90.000000 and 90.000000)),
  longitude numeric(9, 6) check (longitude is null or (longitude between -180.000000 and 180.000000)),
  order_index integer not null default 0,
  arrival_date date,
  departure_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_destination_dates check (
    arrival_date is null or departure_date is null or departure_date >= arrival_date
  ),
  constraint uq_destinations_trip_id unique (trip_id, id)
);

-- Trigger: keep destinations.updated_at fresh
drop trigger if exists set_destinations_updated_at on public.destinations;
create trigger set_destinations_updated_at
  before update on public.destinations
  for each row execute function public.handle_updated_at();

-- 2. Indexes
create index if not exists idx_destinations_trip_id on public.destinations(trip_id);
create index if not exists idx_destinations_trip_order on public.destinations(trip_id, order_index);

-- 3. Row Level Security on Destinations
alter table public.destinations enable row level security;

create policy "destinations_select_own"
  on public.destinations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = destinations.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "destinations_insert_own"
  on public.destinations
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips
      where trips.id = destinations.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "destinations_update_own"
  on public.destinations
  for update
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = destinations.trip_id
        and trips.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.trips
      where trips.id = destinations.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "destinations_delete_own"
  on public.destinations
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = destinations.trip_id
        and trips.user_id = (select auth.uid())
    )
  );
