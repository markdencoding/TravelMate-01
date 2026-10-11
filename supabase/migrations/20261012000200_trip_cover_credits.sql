-- ==============================================================================
-- Migration: 20261012000200_trip_cover_credits.sql
-- Description: Add cover image credit and file attribution columns to public.trips
-- ==============================================================================

alter table public.trips
  add column if not exists cover_image_credit text not null default '',
  add column if not exists cover_image_credit_url text not null default '';
