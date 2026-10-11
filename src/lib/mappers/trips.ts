import type { DbTripRow, DbTripInsert, DbTripUpdate } from '@/lib/types/database';
import type { Trip } from '@/types';
import { calculateDaysCount, formatDateRange } from '@/lib/dates';
import { calculateTripStatus } from '@/lib/trip-status';

/**
 * Maps a Supabase trips table row to the frontend Trip interface.
 * - Dynamically derives trip status using calculateTripStatus (never trusts stale stored value).
 * - Maps budget_amount to budget, estimatedBudget, and budgetCap.
 * - Computes dateRange and daysCount.
 */
export function dbTripToUiTrip(row: DbTripRow, isBookmarked = false): Trip {
  const daysCount = calculateDaysCount(row.start_date, row.end_date);
  const dateRange = formatDateRange(row.start_date, row.end_date);
  const budgetNum = Number(row.budget_amount ?? row.budget) || 0;
  const computedStatus = calculateTripStatus(row.start_date, row.end_date);

  return {
    id: row.id,
    title: row.title,
    destinationRegion: row.destination_region || 'Unspecified Region',
    country: row.country || 'Global',
    dateRange,
    startDate: row.start_date,
    endDate: row.end_date,
    daysCount,
    status: computedStatus,
    statusLabel: computedStatus.toUpperCase(),
    estimatedBudget: budgetNum,
    budget: budgetNum,
    budgetCap: Number((budgetNum * 1.25).toFixed(2)),
    currency: 'PHP',
    actualSpent: 0,
    reconciled: false,
    destinations: row.destination_region ? row.destination_region.split(' & ').map((s) => s.trim()).filter(Boolean) : [],
    activitiesCount: 0,
    accommodationsCount: 0,
    coverImage: row.cover_image || '',
    coverImageAlt: row.cover_image_alt || '',
    coverImageCredit: (row as any).cover_image_credit || '',
    coverImageCreditUrl: (row as any).cover_image_credit_url || '',
    notes: row.notes || '',
    description: row.notes || '',
    privacy: (row.privacy as 'collaborative' | 'private') || 'collaborative',
    isBookmarked,
  };
}

import type { DestinationItem } from '@/lib/validators/trip';

export interface UiTripFormInput {
  title: string;
  startDate: string;
  endDate: string;
  budget?: number;
  budgetAmount?: number;
  currency?: string;
  destinations?: DestinationItem[];
  destinationRegion?: string;
  country?: string;
  notes?: string;
  coverImage?: string;
  coverImageAlt?: string;
  coverImageCredit?: string;
  coverImageCreditUrl?: string;
  privacy?: 'collaborative' | 'private';
}

/**
 * Converts UI form values into a Supabase DbTripInsert payload.
 * - Translates budget/budgetAmount to budget_amount.
 * - Strips any client-provided status (status is automated).
 * - Enforces Philippine Peso (PHP) currency.
 * - Derives destination_region and country from destinations if provided.
 */
export function uiTripToDbInsert(input: UiTripFormInput, userId: string): DbTripInsert {
  const amount = Number(input.budgetAmount ?? input.budget ?? 0);

  const derivedRegion =
    input.destinationRegion?.trim() ||
    (input.destinations && input.destinations.length > 0
      ? input.destinations.map((d) => d.name).filter(Boolean).join(' & ')
      : '');

  const derivedCountry =
    input.country?.trim() ||
    (input.destinations && input.destinations.length > 0
      ? input.destinations.find((d) => d.country)?.country || 'Global'
      : 'Global');

  return {
    user_id: userId,
    title: input.title.trim(),
    start_date: input.startDate,
    end_date: input.endDate,
    budget_amount: amount,
    budget: amount,
    currency: 'PHP',
    destination_region: derivedRegion,
    country: derivedCountry,
    notes: input.notes?.trim() || '',
    cover_image: input.coverImage?.trim() || '',
    cover_image_alt: input.coverImageAlt?.trim() || (input.coverImage ? `${input.title.trim()} cover preview` : ''),
    cover_image_credit: input.coverImageCredit?.trim() || '',
    cover_image_credit_url: input.coverImageCreditUrl?.trim() || '',
    privacy: input.privacy || 'collaborative',
  };
}

/**
 * Converts UI form updates into a Supabase DbTripUpdate payload.
 */
export function uiTripToDbUpdate(input: Partial<UiTripFormInput>): DbTripUpdate {
  const updatePayload: DbTripUpdate = {};

  if (input.title !== undefined) updatePayload.title = input.title.trim();
  if (input.startDate !== undefined) updatePayload.start_date = input.startDate;
  if (input.endDate !== undefined) updatePayload.end_date = input.endDate;

  if (input.budgetAmount !== undefined || input.budget !== undefined) {
    const amount = Number(input.budgetAmount ?? input.budget ?? 0);
    updatePayload.budget_amount = amount;
    updatePayload.budget = amount;
  }

  // Always enforce PHP
  updatePayload.currency = 'PHP';

  if (input.destinationRegion !== undefined) {
    updatePayload.destination_region = input.destinationRegion.trim();
  } else if (input.destinations !== undefined && input.destinations.length > 0) {
    updatePayload.destination_region = input.destinations.map((d) => d.name).filter(Boolean).join(' & ');
  }

  if (input.country !== undefined) {
    updatePayload.country = input.country.trim();
  } else if (input.destinations !== undefined && input.destinations.length > 0) {
    const foundCountry = input.destinations.find((d) => d.country)?.country;
    if (foundCountry) updatePayload.country = foundCountry;
  }
  if (input.notes !== undefined) {
    updatePayload.notes = input.notes.trim();
  }
  if (input.coverImage !== undefined) {
    updatePayload.cover_image = input.coverImage.trim();
  }
  if (input.coverImageAlt !== undefined) {
    updatePayload.cover_image_alt = input.coverImageAlt.trim();
  }
  if (input.coverImageCredit !== undefined) {
    updatePayload.cover_image_credit = input.coverImageCredit.trim();
  }
  if (input.coverImageCreditUrl !== undefined) {
    updatePayload.cover_image_credit_url = input.coverImageCreditUrl.trim();
  }
  if (input.privacy !== undefined) {
    updatePayload.privacy = input.privacy;
  }

  return updatePayload;
}
