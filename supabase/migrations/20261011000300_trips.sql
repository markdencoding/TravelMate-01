-- ==============================================================================
-- Migration: 20261011000300_trips.sql
-- Description: Expeditions and journeys table, date constraints,
--              status automation trigger, indexes, and RLS policies.
-- ==============================================================================

-- 1. Trips Table
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  destination_region text not null default '',
  country text not null default '',
  start_date date not null,
  end_date date not null,
  budget_amount numeric(12, 2) not null default 0.00 check (budget_amount >= 0),
  budget numeric(12, 2) not null default 0.00 check (budget >= 0),
  currency text not null default 'USD' check (length(currency) = 3 and currency = upper(currency)),
  notes text not null default '',
  cover_image text not null default '',
  cover_image_alt text not null default '',
  privacy text not null default 'collaborative' check (privacy in ('collaborative', 'private')),
  status text not null default 'planned' check (status in ('planned', 'ongoing', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_trip_dates check (end_date >= start_date)
);

-- Trigger: keep trips.updated_at fresh
drop trigger if exists set_trips_updated_at on public.trips;
create trigger set_trips_updated_at
  before update on public.trips
  for each row execute function public.handle_updated_at();

-- 2. Status Calculation & Budget Sync Trigger
-- Ensures status is derived from date ranges while providing fast indexed querying.
-- Keeps budget and budget_amount synchronized for app and query compatibility.
create or replace function public.handle_trip_defaults()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Synchronize budget and budget_amount columns
  if new.budget_amount is distinct from old.budget_amount and (new.budget is null or new.budget = old.budget) then
    new.budget := new.budget_amount;
  elsif new.budget is distinct from old.budget and (new.budget_amount is null or new.budget_amount = old.budget_amount) then
    new.budget_amount := new.budget;
  end if;

  -- Derive trip status from active dates
  if current_date < new.start_date then
    new.status := 'planned';
  elsif current_date > new.end_date then
    new.status := 'completed';
  else
    new.status := 'ongoing';
  end if;

  return new;
end;
$$;

drop trigger if exists trip_defaults_trigger on public.trips;
create trigger trip_defaults_trigger
  before insert or update on public.trips
  for each row execute function public.handle_trip_defaults();

-- 3. Indexes
create index if not exists idx_trips_user_id on public.trips(user_id);
create index if not exists idx_trips_user_start on public.trips(user_id, start_date);
create index if not exists idx_trips_status on public.trips(status);

-- 4. Row Level Security on Trips
alter table public.trips enable row level security;

create policy "trips_select_own"
  on public.trips
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "trips_insert_own"
  on public.trips
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "trips_update_own"
  on public.trips
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "trips_delete_own"
  on public.trips
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
