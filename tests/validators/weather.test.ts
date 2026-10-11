import { describe, it, expect } from 'vitest';
import { weatherQuerySchema, mapWmoCode } from '@/lib/validators/weather';

describe('Weather Validator and WMO Code Mapper', () => {
  describe('weatherQuerySchema', () => {
    it('accepts valid coordinates', () => {
      const res = weatherQuerySchema.safeParse({ lat: '35.0116', lon: '135.7681' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.lat).toBeCloseTo(35.0116);
        expect(res.data.lon).toBeCloseTo(135.7681);
      }
    });

    it('rejects latitudes outside [-90, 90]', () => {
      expect(weatherQuerySchema.safeParse({ lat: '95', lon: '0' }).success).toBe(false);
      expect(weatherQuerySchema.safeParse({ lat: '-91', lon: '0' }).success).toBe(false);
    });

    it('rejects longitudes outside [-180, 180]', () => {
      expect(weatherQuerySchema.safeParse({ lat: '0', lon: '185' }).success).toBe(false);
      expect(weatherQuerySchema.safeParse({ lat: '0', lon: '-181' }).success).toBe(false);
    });

    it('rejects non-numeric inputs', () => {
      expect(weatherQuerySchema.safeParse({ lat: 'abc', lon: 'def' }).success).toBe(false);
    });
  });

  describe('mapWmoCode', () => {
    it('maps code 0 to Clear Sky and sunny icon', () => {
      const res = mapWmoCode(0);
      expect(res.condition).toBe('Clear Sky');
      expect(res.icon).toBe('wb_sunny');
    });

    it('maps code 2 to Partly Cloudy', () => {
      const res = mapWmoCode(2);
      expect(res.condition).toBe('Partly Cloudy');
      expect(res.icon).toBe('partly_cloudy_day');
    });

    it('maps rain codes (61-65)', () => {
      const res = mapWmoCode(63);
      expect(res.condition).toBe('Rain');
      expect(res.icon).toBe('rainy');
    });

    it('maps snow codes (71-77)', () => {
      const res = mapWmoCode(73);
      expect(res.condition).toBe('Snow Fall');
      expect(res.icon).toBe('ac_unit');
    });

    it('maps thunderstorm codes (95-99)', () => {
      const res = mapWmoCode(95);
      expect(res.condition).toBe('Thunderstorm');
      expect(res.icon).toBe('thunderstorm');
    });
  });
});
