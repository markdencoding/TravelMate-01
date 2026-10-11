-- ==============================================================================
-- Migration: 20261011000100_helpers.sql
-- Description: Core extensions and shared trigger utility functions.
-- ==============================================================================

-- Enable required cryptographic and UUID generation extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Generic updated_at timestamp trigger function
-- Pinned search_path ensures immunity against search_path injection
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
