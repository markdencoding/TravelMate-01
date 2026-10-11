import { describe, it, expect } from 'vitest';
import { calculateTripStatus } from '@/lib/trip-status';

describe('calculateTripStatus', () => {
  it('returns planned when reference date is before start date', () => {
    const ref = new Date('2026-10-10T12:00:00Z');
    expect(calculateTripStatus('2026-10-12', '2026-10-20', ref)).toBe('planned');
  });

  it('returns ongoing on the exact start date', () => {
    const ref = new Date('2026-10-12T00:00:00Z');
    expect(calculateTripStatus('2026-10-12', '2026-10-20', ref)).toBe('ongoing');
  });

  it('returns ongoing on a middle date of the trip', () => {
    const ref = new Date('2026-10-15T15:30:00Z');
    expect(calculateTripStatus('2026-10-12', '2026-10-20', ref)).toBe('ongoing');
  });

  it('returns ongoing on the exact end date', () => {
    const ref = new Date('2026-10-20T23:59:59Z');
    expect(calculateTripStatus('2026-10-12', '2026-10-20', ref)).toBe('ongoing');
  });

  it('returns completed on the day immediately after end date', () => {
    const ref = new Date('2026-10-21T00:00:00Z');
    expect(calculateTripStatus('2026-10-12', '2026-10-20', ref)).toBe('completed');
  });

  it('returns completed when reference date is far in the future', () => {
    const ref = new Date('2027-01-01T00:00:00Z');
    expect(calculateTripStatus('2026-10-12', '2026-10-20', ref)).toBe('completed');
  });

  it('handles empty dates gracefully with default fallback', () => {
    expect(calculateTripStatus('', '')).toBe('planned');
  });
});
