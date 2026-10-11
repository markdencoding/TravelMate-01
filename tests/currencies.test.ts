import { describe, it, expect } from 'vitest';
import {
  SHARED_CURRENCIES,
  CURRENCY_LIST,
  getCurrencyInfo,
  formatCurrencyValue,
  formatCurrency,
} from '@/lib/currencies';

describe('Shared Currency System', () => {
  const REQUIRED_CURRENCIES = [
    'PHP', 'USD', 'EUR', 'JPY', 'GBP',
    'AUD', 'CAD', 'SGD', 'HKD', 'KRW',
    'CNY', 'TWD', 'THB', 'VND', 'IDR',
    'MYR', 'INR', 'AED', 'SAR', 'CHF',
    'NZD',
  ];

  it('contains approximately 40 common currencies', () => {
    expect(CURRENCY_LIST.length).toBeGreaterThanOrEqual(38);
    expect(CURRENCY_LIST.length).toBeLessThanOrEqual(45);
  });

  it('contains every single explicitly requested currency', () => {
    REQUIRED_CURRENCIES.forEach((code) => {
      const curr = SHARED_CURRENCIES[code];
      expect(curr).toBeDefined();
      expect(curr.code).toBe(code);
      expect(curr.symbol).toBeTruthy();
      expect(curr.name).toBeTruthy();
      expect(curr.baseRateToUsd).toBeGreaterThan(0);
      expect(typeof curr.precision).toBe('number');
    });
  });

  it('getCurrencyInfo resolves clean codes and compound labels', () => {
    expect(getCurrencyInfo('USD').code).toBe('USD');
    expect(getCurrencyInfo('JPY (¥)').code).toBe('JPY');
    expect(getCurrencyInfo('php').code).toBe('PHP');
    // Fallback on unknown
    expect(getCurrencyInfo('XYZ').code).toBe('USD');
  });

  it('formatCurrencyValue formats correctly with currency precision', () => {
    expect(formatCurrencyValue(1500, 'JPY')).toBe('¥1,500');
    expect(formatCurrencyValue(25.5, 'USD')).toBe('$25.50');
    expect(formatCurrencyValue(500, 'PHP')).toBe('₱500.00');
  });

  describe('formatCurrency system-wide helper', () => {
    it('formats numbers in Philippine peso (PHP) with ₱ symbol', () => {
      const formatted = formatCurrency(1500);
      expect(formatted).toContain('₱');
      expect(formatted).toContain('1,500');
    });

    it('handles zero and decimal amounts correctly', () => {
      const zero = formatCurrency(0);
      expect(zero).toContain('₱');
      expect(zero).toContain('0');

      const decimals = formatCurrency(1234.5);
      expect(decimals).toContain('₱');
      expect(decimals).toContain('1,234.50');
    });

    it('respects optional Intl options such as maximumFractionDigits', () => {
      const noDecimals = formatCurrency(1234.56, { maximumFractionDigits: 0 });
      expect(noDecimals).toContain('₱');
      expect(noDecimals).toContain('1,235');
    });

    it('safely handles non-finite values by falling back to zero', () => {
      expect(formatCurrency(NaN)).toContain('₱');
      expect(formatCurrency(NaN)).toContain('0.00');
    });
  });
});
