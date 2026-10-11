-- ==============================================================================
-- Migration: 20261011000700_notifications.sql
-- Description: In-app reminders and notifications table,
--              type constraints, indexes, and RLS policies.
-- ==============================================================================

-- 1. Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete cascade,
  type text not null check (
    type in ('budget', 'weather', 'document', 'waypoint', 'completed', 'system')
  ),
  title text not null,
  message text not null,
  remind_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. Indexes
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_trip_id on public.notifications(trip_id);
create index if not exists idx_notifications_user_read on public.notifications(user_id, read_at);

-- 3. Row Level Security on Notifications
alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "notifications_insert_own"
  on public.notifications
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "notifications_update_own"
  on public.notifications
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notifications_delete_own"
  on public.notifications
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
