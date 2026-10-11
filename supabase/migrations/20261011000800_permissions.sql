-- ==============================================================================
-- Migration: 20261011000800_permissions.sql
-- Description: Revoke all public privileges from anonymous role;
--              grant necessary operation grants to authenticated role.
-- ==============================================================================

-- 1. Revoke all privileges from anon role on all tables
revoke all on table public.profiles from anon;
revoke all on table public.trips from anon;
revoke all on table public.destinations from anon;
revoke all on table public.itinerary_items from anon;
revoke all on table public.expenses from anon;
revoke all on table public.notifications from anon;

-- 2. Grant minimal required operations to authenticated role
-- Profiles: Users select and update their own profile. Inserts are strictly handled
-- by auth triggers, and deletes cascade from auth.users.
grant select, update on table public.profiles to authenticated;

-- Trips & Child Domain Entities: Full CRUD granted to authenticated role,
-- strictly bounded and filtered per-row by Row Level Security policies.
grant select, insert, update, delete on table public.trips to authenticated;
grant select, insert, update, delete on table public.destinations to authenticated;
grant select, insert, update, delete on table public.itinerary_items to authenticated;
grant select, insert, update, delete on table public.expenses to authenticated;
grant select, insert, update, delete on table public.notifications to authenticated;
