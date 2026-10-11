-- ==============================================================================
-- Migration: 20261011000500_itinerary_items.sql
-- Description: Day-by-day itinerary activities, composite FKs,
--              boundary date triggers, indexes, and RLS policies.
-- ==============================================================================

-- 1. Itinerary Items Table
create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  destination_id uuid,
  day_date date not null,
  title text not null,
  description text not null default '',
  start_time time,
  end_time time,
  category text not null check (
    category in (
      'activities', 'food', 'transport', 'lodging',
      'photo', 'nature', 'culture', 'sightseeing',
      'dining', 'leisure'
    )
  ),
  location_name text not null default '',
  latitude numeric(9, 6) check (latitude is null or (latitude between -90.000000 and 90.000000)),
  longitude numeric(9, 6) check (longitude is null or (longitude between -180.000000 and 180.000000)),
  cost numeric(12, 2) not null default 0.00 check (cost >= 0),
  currency text not null default 'USD' check (length(currency) = 3 and currency = upper(currency)),
  booking_ref text not null default '',
  notes text not null default '',
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_item_times check (
    start_time is null or end_time is null or end_time >= start_time
  ),
  constraint fk_items_destination foreign key (trip_id, destination_id)
    references public.destinations(trip_id, id)
    on delete set null,
  constraint uq_itinerary_items_trip_id unique (trip_id, id)
);

-- Trigger: keep itinerary_items.updated_at fresh
drop trigger if exists set_itinerary_items_updated_at on public.itinerary_items;
create trigger set_itinerary_items_updated_at
  before update on public.itinerary_items
  for each row execute function public.handle_updated_at();

-- 2. Date Boundary Enforcement Triggers

-- Trigger A: Verify day_date falls within the parent trip date range
create or replace function public.validate_itinerary_item_dates()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_start date;
  v_end date;
begin
  select start_date, end_date into v_start, v_end
  from public.trips
  where id = new.trip_id;

  if not found then
    raise exception 'Parent trip % does not exist.', new.trip_id;
  end if;

  if new.day_date < v_start or new.day_date > v_end then
    raise exception 'Activity date (%) must fall within trip date boundaries (% to %).',
      new.day_date, v_start, v_end;
  end if;

  return new;
end;
$$;

drop trigger if exists check_item_dates_trigger on public.itinerary_items;
create trigger check_item_dates_trigger
  before insert or update on public.itinerary_items
  for each row execute function public.validate_itinerary_item_dates();

-- Trigger B: Prevent contracting trip dates if existing itinerary items would be out-of-bounds
create or replace function public.guard_trip_date_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.start_date > old.start_date or new.end_date < old.end_date) then
    if exists (
      select 1
      from public.itinerary_items
      where trip_id = new.id
        and (day_date < new.start_date or day_date > new.end_date)
    ) then
      raise exception 'Cannot adjust trip dates: scheduled activities exist outside the new range (% to %). Reschedule or remove them first.',
        new.start_date, new.end_date;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_trip_dates on public.trips;
create trigger guard_trip_dates
  before update of start_date, end_date on public.trips
  for each row execute function public.guard_trip_date_changes();

-- 3. Indexes
create index if not exists idx_itinerary_items_trip_id on public.itinerary_items(trip_id);
create index if not exists idx_itinerary_items_dest_id on public.itinerary_items(destination_id);
create index if not exists idx_itinerary_items_timing on public.itinerary_items(trip_id, day_date, start_time);

-- 4. Row Level Security on Itinerary Items
alter table public.itinerary_items enable row level security;

create policy "itinerary_items_select_own"
  on public.itinerary_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = itinerary_items.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "itinerary_items_insert_own"
  on public.itinerary_items
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips
      where trips.id = itinerary_items.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "itinerary_items_update_own"
  on public.itinerary_items
  for update
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = itinerary_items.trip_id
        and trips.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.trips
      where trips.id = itinerary_items.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "itinerary_items_delete_own"
  on public.itinerary_items
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = itinerary_items.trip_id
        and trips.user_id = (select auth.uid())
    )
  );
