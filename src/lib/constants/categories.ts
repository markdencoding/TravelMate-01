/**
 * Database CHECK constraint aligned category constants.
 */

export const ACTIVITY_CATEGORIES = [
  'activities',
  'food',
  'transport',
  'lodging',
  'photo',
  'nature',
  'culture',
  'sightseeing',
  'dining',
  'leisure',
] as const;

export type DbActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const EXPENSE_CATEGORIES = [
  'food',
  'activities',
  'transport',
  'lodging',
  'misc',
  'dining',
  'sightseeing',
] as const;

export type DbExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
