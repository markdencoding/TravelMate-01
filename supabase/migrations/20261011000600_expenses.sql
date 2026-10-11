-- ==============================================================================
-- Migration: 20261011000600_expenses.sql
-- Description: Financial expenses ledger, composite FK to activities,
--              category constraints, indexes, and RLS policies.
-- ==============================================================================

-- 1. Expenses Table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  itinerary_item_id uuid,
  category text not null check (
    category in (
      'food', 'activities', 'transport', 'lodging',
      'misc', 'dining', 'sightseeing'
    )
  ),
  title text not null,
  description text not null default '',
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'USD' check (length(currency) = 3 and currency = upper(currency)),
  expense_date date not null,
  payment_status text not null default 'estimated' check (
    payment_status in ('paid', 'deposit', 'estimated', 'planned', 'reconciled')
  ),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fk_expenses_item foreign key (trip_id, itinerary_item_id)
    references public.itinerary_items(trip_id, id)
    on delete set null
);

-- Trigger: keep expenses.updated_at fresh
drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
  before update on public.expenses
  for each row execute function public.handle_updated_at();

-- 2. Indexes
create index if not exists idx_expenses_trip_id on public.expenses(trip_id);
create index if not exists idx_expenses_item_id on public.expenses(itinerary_item_id);
create index if not exists idx_expenses_timing on public.expenses(trip_id, expense_date);

-- 3. Row Level Security on Expenses
alter table public.expenses enable row level security;

create policy "expenses_select_own"
  on public.expenses
  for select
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "expenses_insert_own"
  on public.expenses
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "expenses_update_own"
  on public.expenses
  for update
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = (select auth.uid())
    )
  );

create policy "expenses_delete_own"
  on public.expenses
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = (select auth.uid())
    )
  );
