import type { DbProfileRow, DbProfileUpdate } from '@/lib/types/database';
import type { CurrentUser, UserPreferences } from '@/types';

/**
 * Maps a Supabase profiles table row to the frontend CurrentUser model.
 */
export function dbProfileToUiUser(row: DbProfileRow): CurrentUser {
  return {
    name: row.display_name || 'Traveler',
    email: row.email,
    avatar:
      row.avatar_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: row.role === 'admin' ? 'Curator / Admin' : 'Explorer',
  };
}

/**
 * Maps a Supabase profiles table row to the frontend UserPreferences model.
 * Preserves browser-only local settings like theme mode.
 */
export function dbProfileToUiPreferences(
  row: DbProfileRow,
  existingLocalPrefs?: Partial<UserPreferences>
): UserPreferences {
  return {
    currency: row.preferred_currency || 'USD',
    measurementUnits: (row.measurement_units as 'metric' | 'imperial') || 'metric',
    tempUnit: row.measurement_units === 'imperial' ? 'F' : 'C',
    distUnit: row.measurement_units === 'imperial' ? 'mi' : 'km',
    dateFormat: row.date_format || 'YYYY-MM-DD',
    timeFormat: (row.time_format as '12' | '24') || '24',
    notificationsEnabled: row.notifications_enabled,
    theme: existingLocalPrefs?.theme || 'system',
    offlineSync: existingLocalPrefs?.offlineSync ?? false,
    notifications: existingLocalPrefs?.notifications || {
      tripDeparture: true,
      budgetOverrun: true,
      weatherAdvisory: true,
      productUpdates: false,
    },
  };
}

export interface UiProfileUpdateInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  currency?: string;
  measurementUnits?: 'metric' | 'imperial';
  dateFormat?: string;
  timeFormat?: '12' | '24';
  notificationsEnabled?: boolean;
}

/**
 * Converts UI profile and settings form inputs into a Supabase DbProfileUpdate payload.
 * Never touches role or is_active (guarded by DB trigger).
 */
export function uiProfileToDbUpdate(input: UiProfileUpdateInput): DbProfileUpdate {
  const payload: DbProfileUpdate = {};

  if (input.displayName !== undefined) payload.display_name = input.displayName.trim();
  if (input.bio !== undefined) payload.bio = input.bio.trim();
  if (input.avatarUrl !== undefined) payload.avatar_url = input.avatarUrl.trim();
  if (input.currency !== undefined) {
    payload.preferred_currency = input.currency.slice(0, 3).toUpperCase();
  }
  if (input.measurementUnits !== undefined) {
    payload.measurement_units = input.measurementUnits;
  }
  if (input.dateFormat !== undefined) {
    payload.date_format = input.dateFormat;
  }
  if (input.timeFormat !== undefined) {
    payload.time_format = input.timeFormat;
  }
  if (input.notificationsEnabled !== undefined) {
    payload.notifications_enabled = input.notificationsEnabled;
  }

  return payload;
}
