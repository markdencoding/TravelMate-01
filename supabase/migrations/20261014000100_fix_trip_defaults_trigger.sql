-- ==============================================================================
-- Migration: 20261014000100_fix_trip_defaults_trigger.sql
-- Description: Fix handle_trip_defaults() to avoid referencing unassigned OLD
--              record during INSERT operations (PostgreSQL PL/pgSQL error 55000).
-- ==============================================================================

create or replace function public.handle_trip_defaults()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Synchronize budget and budget_amount columns
  if tg_op = 'UPDATE' then
    if new.budget_amount is distinct from old.budget_amount and (new.budget is null or new.budget = old.budget) then
      new.budget := new.budget_amount;
    elsif new.budget is distinct from old.budget and (new.budget_amount is null or new.budget_amount = old.budget_amount) then
      new.budget_amount := new.budget;
    end if;
  else
    -- On INSERT, synchronize when either column is provided
    if new.budget_amount is not null and (new.budget is null or new.budget = 0) then
      new.budget := new.budget_amount;
    elsif new.budget is not null and (new.budget_amount is null or new.budget_amount = 0) then
      new.budget_amount := new.budget;
    end if;
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
