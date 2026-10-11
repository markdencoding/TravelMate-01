-- ==============================================================================
-- Migration: 20261012000100_currency_php.sql
-- Description: Standardize ledger currency across the entire system to
--              Philippine Peso (PHP, ₱) as the single primary currency.
-- ==============================================================================

-- 1. Update defaults and existing rows on trips table
alter table public.trips
  alter column currency set default 'PHP';

update public.trips
set currency = 'PHP'
where currency is distinct from 'PHP';

-- 2. Update defaults and existing rows on profiles table
alter table public.profiles
  alter column preferred_currency set default 'PHP';

update public.profiles
set preferred_currency = 'PHP'
where preferred_currency is distinct from 'PHP';

-- 3. Update defaults and existing rows on expenses table
alter table public.expenses
  alter column currency set default 'PHP';

update public.expenses
set currency = 'PHP'
where currency is distinct from 'PHP';
