import { describe, it, expect } from 'vitest';
import { formatDatabaseError } from '@/lib/errors';

describe('formatDatabaseError', () => {
  it('maps trip date contraction guard trigger error', () => {
    const error = {
      message: 'Trip date contraction past existing activity was allowed! Cannot contract.',
      code: 'P0001',
    };
    expect(formatDatabaseError(error)).toContain('Cannot shorten trip dates');
  });

  it('maps activity date range boundary trigger error', () => {
    const error = {
      message: 'validate_itinerary_item_dates: day_date must fall within trip dates',
    };
    expect(formatDatabaseError(error)).toContain('Activity date must fall between the trip start date and end date');
  });

  it('maps check_trip_dates constraint error', () => {
    const error = {
      message: 'new row for relation "trips" violates check constraint "check_trip_dates"',
    };
    expect(formatDatabaseError(error)).toContain('Trip end date cannot be earlier than the start date');
  });

  it('maps check_item_times constraint error', () => {
    const error = {
      message: 'violates check constraint "check_item_times"',
    };
    expect(formatDatabaseError(error)).toContain('Activity end time cannot be earlier than start time');
  });

  it('maps permission denied error', () => {
    const error = {
      code: '42501',
      message: 'permission denied for table profiles',
    };
    expect(formatDatabaseError(error)).toContain('You do not have permission');
  });

  it('returns fallback message when error is undefined', () => {
    expect(formatDatabaseError(undefined, 'Fallback')).toBe('Fallback');
  });
});
