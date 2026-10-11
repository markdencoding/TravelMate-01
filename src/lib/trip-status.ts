import type { TripStatus } from './types/database';

/**
 * Pure helper function to compute trip status from date range.
 * Status is never stored by clients and is always dynamically derived.
 *
 * Rules:
 * - If current date < start_date: 'planned'
 * - If current date > end_date: 'completed'
 * - If start_date <= current date <= end_date: 'ongoing'
 *
 * @param startDate ISO date string 'YYYY-MM-DD'
 * @param endDate ISO date string 'YYYY-MM-DD'
 * @param referenceDate Optional reference date (defaults to current date at 00:00:00 local time)
 */
export function calculateTripStatus(
  startDate: string,
  endDate: string,
  referenceDate = new Date()
): TripStatus {
  if (!startDate || !endDate) return 'planned';

  const refIso = referenceDate.toISOString().split('T')[0];

  if (refIso < startDate) {
    return 'planned';
  }
  if (refIso > endDate) {
    return 'completed';
  }
  return 'ongoing';
}
