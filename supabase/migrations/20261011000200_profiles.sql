-- ==============================================================================
-- Migration: 20261011000200_profiles.sql
-- Description: User profiles, preference attributes, admin detection,
--              auth triggers, privilege protection, and RLS policies.
-- ==============================================================================

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  email text not null default '',
  avatar_url text not null default '',
  role text not null default 'traveler' check (role in ('traveler', 'admin')),
  is_active boolean not null default true,
  bio text not null default '',
  preferred_currency text not null default 'USD' check (length(preferred_currency) = 3 and preferred_currency = upper(preferred_currency)),
  date_format text not null default 'YYYY-MM-DD' check (date_format in ('YYYY-MM-DD', 'MMM DD, YYYY', 'DD/MM/YYYY')),
  measurement_units text not null default 'metric' check (measurement_units in ('metric', 'imperial')),
  time_format text not null default '24' check (time_format in ('12', '24')),
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger: keep profiles.updated_at fresh
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Indexes for role checks and status filtering
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_is_active on public.profiles(is_active);

-- 2. Security Function: is_admin()
-- STABLE, SECURITY DEFINER with fixed empty search_path
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and is_active = true
  );
$$;

-- 3. Auth Trigger: Create Profile upon Auth Registration
-- ALWAYS sets role='traveler' and is_active=true. Never accepts user-supplied role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    email,
    avatar_url,
    role,
    is_active,
    preferred_currency
  )
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      nullif(trim(split_part(new.email, '@', 1)), ''),
      'Traveler'
    ),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'traveler',
    true,
    'USD'
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = case
      when public.profiles.display_name = '' then excluded.display_name
      else public.profiles.display_name
    end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Auth Trigger: Sync Email on Change in auth.users
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = coalesce(new.email, ''),
        updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_user_email_change();

-- 5. Protection Trigger: Prevent Self-Promotion and Self-Disabling
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Restrict role and is_active changes to active administrators or privileged database roles
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    -- When called by an authenticated user session (auth.uid() is set), enforce active admin status
    if auth.uid() is not null then
      if not public.is_admin() then
        raise exception 'Unauthorized: Only active administrators can modify roles or account activation status.';
      end if;
    elsif not (session_user in ('postgres', 'service_role', 'supabase_admin') or current_user in ('postgres', 'service_role', 'supabase_admin')) then
      raise exception 'Unauthorized: Only active administrators can modify roles or account activation status.';
    end if;
  end if;

  -- AD-4: An admin cannot disable their own account
  if (auth.uid() is not null and old.id = auth.uid() and new.is_active = false and old.is_active = true) then
    raise exception 'Operation not permitted: Administrators cannot disable their own account.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profiles_privileges on public.profiles;
create trigger guard_profiles_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- 6. Row Level Security on Profiles
alter table public.profiles enable row level security;

-- Authenticated users can view their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- Authenticated users can update their own profile (trigger guards role/is_active)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No client insert or delete policies: profiles are created by the auth trigger
-- and deleted automatically when the auth user is deleted.
