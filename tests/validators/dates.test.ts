import { describe, expect, it } from 'vitest';
import {
  calculateDaysCount,
  formatDateRange,
  getDatesBetween,
  isValidDateRange,
} from '../../src/lib/dates';

describe('Date utility functions', () => {
  describe('isValidDateRange', () => {
    it('returns true when end date is equal to start date', () => {
      expect(isValidDateRange('2026-10-12', '2026-10-12')).toBe(true);
    });

    it('returns true when end date is after start date', () => {
      expect(isValidDateRange('2026-10-12', '2026-10-24')).toBe(true);
    });

    it('returns false when end date is before start date', () => {
      expect(isValidDateRange('2026-10-24', '2026-10-12')).toBe(false);
    });

    it('returns false when invalid strings are provided', () => {
      expect(isValidDateRange('invalid', '2026-10-12')).toBe(false);
      expect(isValidDateRange('', '')).toBe(false);
    });
  });

  describe('calculateDaysCount', () => {
    it('calculates inclusive days correctly', () => {
      // 12th, 13th, 14th = 3 days
      expect(calculateDaysCount('2026-10-12', '2026-10-14')).toBe(3);
    });

    it('returns 1 day for single-day trips', () => {
      expect(calculateDaysCount('2026-10-12', '2026-10-12')).toBe(1);
    });
  });

  describe('formatDateRange', () => {
    it('formats within the same year', () => {
      expect(formatDateRange('2026-10-12', '2026-10-24')).toBe('Oct 12 – Oct 24, 2026');
    });

    it('formats across different years', () => {
      expect(formatDateRange('2026-12-28', '2027-01-05')).toBe('Dec 28, 2026 – Jan 5, 2027');
    });
  });

  describe('getDatesBetween', () => {
    it('returns array of dates in interval', () => {
      const dates = getDatesBetween('2026-10-12', '2026-10-15');
      expect(dates).toEqual(['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15']);
    });

    it('returns empty array when end is before start', () => {
      expect(getDatesBetween('2026-10-15', '2026-10-12')).toEqual([]);
    });
  });
});
