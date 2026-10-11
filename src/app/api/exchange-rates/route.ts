import { NextResponse } from 'next/server';
import { SHARED_CURRENCIES } from '@/lib/currencies';

// 1 hour cache duration
export const revalidate = 3600;

interface OpenErApiResponse {
  result: string;
  provider: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  rates: Record<string, number>;
}

export async function GET() {
  // Built-in fallback rates based on SHARED_CURRENCIES relative to PHP
  const fallbackRates: Record<string, number> = {};
  const phpBaseRate = SHARED_CURRENCIES.PHP?.baseRateToUsd || 58.2;
  Object.keys(SHARED_CURRENCIES).forEach((code) => {
    // 1 PHP = (SHARED_CURRENCIES[code].baseRateToUsd / phpBaseRate)
    fallbackRates[code] = Number((SHARED_CURRENCIES[code].baseRateToUsd / phpBaseRate).toFixed(6));
  });

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/PHP', {
      next: { revalidate: 3600 },
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`Exchange rate API responded with status ${res.status}, using fallbacks`);
      return NextResponse.json({
        success: true,
        source: 'fallback',
        base: 'PHP',
        rates: fallbackRates,
        timestamp: Date.now(),
      });
    }

    const data: OpenErApiResponse = await res.json();

    if (!data.rates || typeof data.rates !== 'object') {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        base: 'PHP',
        rates: fallbackRates,
        timestamp: Date.now(),
      });
    }

    // Filter and merge rates strictly for supported currencies
    const supportedRates: Record<string, number> = {};
    Object.keys(SHARED_CURRENCIES).forEach((code) => {
      if (typeof data.rates[code] === 'number' && data.rates[code] > 0) {
        supportedRates[code] = data.rates[code];
      } else {
        // Fallback to our calibrated constant if missing from feed
        supportedRates[code] = fallbackRates[code] ?? 1.0;
      }
    });

    return NextResponse.json({
      success: true,
      source: 'live',
      base: 'PHP',
      rates: supportedRates,
      timestamp: data.time_last_update_unix ? data.time_last_update_unix * 1000 : Date.now(),
    });
  } catch (error) {
    console.warn('Failed to fetch live exchange rates:', error);
    return NextResponse.json({
      success: true,
      source: 'fallback',
      base: 'PHP',
      rates: fallbackRates,
      timestamp: Date.now(),
    });
  }
}
