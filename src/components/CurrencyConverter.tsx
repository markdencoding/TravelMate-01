import React, { useState, useEffect, useMemo, useCallback } from 'react';

import {
  SHARED_CURRENCIES,
  type CurrencyInfo,
} from '../lib/currencies';
import { SearchableCurrencySelect } from './SearchableCurrencySelect';

export { SHARED_CURRENCIES as SUPPORTED_CURRENCIES } from '../lib/currencies';
export type { CurrencyInfo } from '../lib/currencies';
const SUPPORTED_CURRENCIES = SHARED_CURRENCIES;


interface CurrencyConverterProps {
  destinationCurrency: string;
  homeCurrency: string;
  onApplyToExpenseDraft?: (amount: number, currency: string, note?: string) => void;
  className?: string;
  onRateChange?: (rate: number, from: string, to: string) => void;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  destinationCurrency = 'JPY',
  homeCurrency = 'PHP',
  onApplyToExpenseDraft,
  className = '',
  onRateChange,
}) => {
  // Primary conversion state: defaults to converting FROM Philippine Pesos (PHP) to destination currency
  const [fromCode, setFromCode] = useState<string>('PHP');
  const [toCode, setToCode] = useState<string>(() => {
    return destinationCurrency !== 'PHP' && SUPPORTED_CURRENCIES[destinationCurrency]
      ? destinationCurrency
      : 'USD';
  });

  // When parent changes destination currency, update target
  useEffect(() => {
    if (destinationCurrency && destinationCurrency !== 'PHP' && SUPPORTED_CURRENCIES[destinationCurrency]) {
      setToCode(destinationCurrency);
    }
  }, [destinationCurrency]);

  // Amount inputs (synced)
  const [fromAmountStr, setFromAmountStr] = useState<string>('1000');
  const [lastEdited, setLastEdited] = useState<'from' | 'to'>('from');

  // Real-time Rates Engine (PHP base)
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    const phpBase = SUPPORTED_CURRENCIES.PHP?.baseRateToUsd || 58.2;
    Object.keys(SUPPORTED_CURRENCIES).forEach((code) => {
      initial[code] = SUPPORTED_CURRENCIES[code].baseRateToUsd / phpBase;
    });
    return initial;
  });

  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());
  const [lastTickDirection, setLastTickDirection] = useState<'up' | 'down' | null>(null);
  const [activeTab, setActiveTab] = useState<'converter' | 'cheatsheet' | 'fx-info'>('converter');

  // Foreign Card Fee simulation (0%, 1.5%, 3%)
  const [cardFeePercent, setCardFeePercent] = useState<number>(0);

  // Calculate live exchange rate from fromCode to toCode
  const exchangeRate = useMemo(() => {
    const fromRate = rates[fromCode] || 1.0;
    const toRate = rates[toCode] || 1.0;
    return fromRate > 0 ? toRate / fromRate : 0;
  }, [fromCode, toCode, rates]);

  // Inverse rate
  const inverseRate = useMemo(() => {
    return exchangeRate > 0 ? 1 / exchangeRate : 0;
  }, [exchangeRate]);

  // Notify parent of rate if needed
  useEffect(() => {
    if (onRateChange) {
      onRateChange(exchangeRate, fromCode, toCode);
    }
  }, [exchangeRate, fromCode, toCode, onRateChange]);

  // Real-time market tick simulation
  useEffect(() => {
    if (!isLiveFeedActive) return;

    const interval = setInterval(() => {
      setRates((prevRates) => {
        // Pick one currency to slightly fluctuate (e.g., JPY, EUR, GBP, or current from/to)
        const targetCurrency = Math.random() > 0.5 ? fromCode : toCode;
        if (targetCurrency === 'USD') return prevRates;

        const current = prevRates[targetCurrency] || 1.0;
        // Small micro-fluctuation between -0.1% and +0.1%
        const deltaFactor = 1 + (Math.random() * 0.002 - 0.001);
        const updatedVal = Number((current * deltaFactor).toFixed(4));

        setLastTickDirection(updatedVal >= current ? 'up' : 'down');
        setLastUpdatedTime(new Date());

        return {
          ...prevRates,
          [targetCurrency]: updatedVal,
        };
      });

      // Reset tick direction animation after 1.5s
      setTimeout(() => {
        setLastTickDirection(null);
      }, 1500);
    }, 4500);

    return () => clearInterval(interval);
  }, [isLiveFeedActive, fromCode, toCode]);

  // Fetch live rates from Route Handler on mount
  useEffect(() => {
    let isMounted = true;
    async function loadRates() {
      try {
        const res = await fetch('/api/exchange-rates');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.rates && typeof data.rates === 'object') {
            setRates((prev) => ({
              ...prev,
              ...data.rates,
            }));
            setLastUpdatedTime(new Date());
          }
        }
      } catch (err) {
        console.warn('Using cached exchange rates:', err);
      }
    }
    loadRates();
    return () => {
      isMounted = false;
    };
  }, []);

  // Manual refresh trigger
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/exchange-rates');
      if (res.ok) {
        const data = await res.json();
        if (data.rates && typeof data.rates === 'object') {
          setRates((prev) => ({
            ...prev,
            ...data.rates,
          }));
        }
      }
    } catch {
      setRates((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (key !== 'USD' && SUPPORTED_CURRENCIES[key]) {
            const base = SUPPORTED_CURRENCIES[key].baseRateToUsd;
            const variance = 1 + (Math.random() * 0.006 - 0.003);
            next[key] = Number((base * variance).toFixed(4));
          }
        });
        return next;
      });
    } finally {
      setLastUpdatedTime(new Date());
      setIsRefreshing(false);
      setLastTickDirection('up');
      setTimeout(() => setLastTickDirection(null), 1200);
    }
  }, []);

  // Format currency value helper
  const fromInfo = SUPPORTED_CURRENCIES[fromCode] || SUPPORTED_CURRENCIES.USD;
  const toInfo = SUPPORTED_CURRENCIES[toCode] || SUPPORTED_CURRENCIES.USD;

  // Calculate toAmount based on fromAmount
  const numFrom = parseFloat(fromAmountStr) || 0;
  const rawConverted = numFrom * exchangeRate;
  const feeAmount = rawConverted * (cardFeePercent / 100);
  const effectiveConverted = rawConverted + (fromCode === toCode ? 0 : feeAmount);

  // Switch / Swap currencies button
  const handleSwapCurrencies = () => {
    const oldFrom = fromCode;
    const oldTo = toCode;
    setFromCode(oldTo);
    setToCode(oldFrom);

    // Also invert amount or set reasonable converted amount
    if (numFrom > 0 && exchangeRate > 0) {
      const precision = (SUPPORTED_CURRENCIES[oldTo] || SUPPORTED_CURRENCIES.USD).precision;
      setFromAmountStr(rawConverted.toFixed(precision));
    }
  };

  // Quick switch between Destination Currency & Home Currency
  const isCurrentlyDestinationToHome = fromCode === destinationCurrency && toCode === homeCurrency;
  const isCurrentlyHomeToDestination = fromCode === homeCurrency && toCode === destinationCurrency;

  const handleSetDestinationToHome = () => {
    setFromCode(destinationCurrency);
    setToCode(homeCurrency);
  };

  const handleSetHomeToDestination = () => {
    setFromCode(homeCurrency);
    setToCode(destinationCurrency);
  };

  // Quick amount chip selection
  const handleQuickChipSelect = (amt: number) => {
    setFromAmountStr(amt.toString());
    setLastEdited('from');
  };

  // Format timestamp
  const formattedTime = lastUpdatedTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 transition-colors ${className}`}
    >
      {/* Top Header: Title, Live Ticker Badge & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">currency_exchange</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Real-Time Currency Converter
              </h3>
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                  lastTickDirection === 'up'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 scale-105'
                    : lastTickDirection === 'down'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 scale-105'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                }`}
                title="Live mid-market currency rates feed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE RATES</span>
                {lastTickDirection === 'up' && <span className="text-[9px]">▲</span>}
                {lastTickDirection === 'down' && <span className="text-[9px]">▼</span>}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Approximate rates converting from Philippine Pesos (₱) to world currencies
            </p>
          </div>
        </div>

        {/* Live Ticker Controls & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh exchange rates"
          >
            <span
              className={`material-symbols-outlined text-[15px] ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            >
              refresh
            </span>
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLiveFeedActive(!isLiveFeedActive)}
            className={`h-8 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLiveFeedActive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
            title={isLiveFeedActive ? 'Pause auto-ticker' : 'Resume live auto-ticker'}
          >
            <span className="material-symbols-outlined text-[15px]">
              {isLiveFeedActive ? 'sensors' : 'sensors_off'}
            </span>
            <span className="hidden sm:inline">{isLiveFeedActive ? 'Auto-Tick ON' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: Converter / Pocket Cheat Sheet / Card FX Info */}
      <div className="flex items-center justify-between gap-2 pt-3">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('converter')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'converter'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Interactive Converter
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cheatsheet')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'cheatsheet'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Pocket Cheat Sheet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fx-info')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === 'fx-info'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Card Fee Simulator
          </button>
        </div>

        {/* Quick Switch Button (Destination <-> Home) */}
        <div className="hidden md:flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Quick Pair:</span>
          <button
            type="button"
            onClick={handleSetDestinationToHome}
            className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              isCurrentlyDestinationToHome
                ? 'bg-primary text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {fromInfo.flag} {destinationCurrency} ➔ {toInfo.flag} {homeCurrency}
          </button>
          <button
            type="button"
            onClick={handleSetHomeToDestination}
            className={`px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              isCurrentlyHomeToDestination
                ? 'bg-primary text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {homeCurrency} ➔ {destinationCurrency}
          </button>
        </div>
      </div>

      {/* Main Tab 1: Interactive Converter */}
      {activeTab === 'converter' && (
        <div className="flex flex-col gap-4 mt-3">
          {/* Conversion Grid with Swap Button in Center */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            {/* Source Currency Card (e.g. Local Destination Currency JPY) */}
            <div className="md:col-span-5 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>From</span>
                  {fromCode === destinationCurrency && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                      LOCAL DESTINATION
                    </span>
                  )}
                  {fromCode === homeCurrency && fromCode !== destinationCurrency && (
                    <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                      HOME CURRENCY
                    </span>
                  )}
                </span>

                <div className="w-36 sm:w-44">
                  <SearchableCurrencySelect
                    compact
                    value={fromCode}
                    onChange={(code) => setFromCode(code)}
                  />
                </div>
              </div>

              {/* Amount Input */}
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold text-slate-400 dark:text-slate-500">
                  {fromInfo.symbol}
                </span>
                <input
                  type="number"
                  step="any"
                  value={fromAmountStr}
                  onChange={(e) => {
                    setFromAmountStr(e.target.value);
                    setLastEdited('from');
                  }}
                  placeholder="0.00"
                  className="w-full bg-transparent font-bold text-2xl sm:text-3xl text-slate-900 dark:text-slate-100 focus:outline-none tracking-tight"
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>{fromInfo.name}</span>
                <span className="font-mono text-[11px]">
                  1 {fromCode} = {exchangeRate < 1 ? exchangeRate.toFixed(4) : exchangeRate.toFixed(2)}{' '}
                  {toCode}
                </span>
              </div>
            </div>

            {/* Middle Swap Button */}
            <div className="md:col-span-1 flex justify-center py-1 md:py-0">
              <button
                type="button"
                onClick={handleSwapCurrencies}
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary-container text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                title="Switch conversion direction (Local ⇄ Home)"
              >
                <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
              </button>
            </div>

            {/* Target Currency Card (e.g. Home Currency USD) */}
            <div className="md:col-span-5 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700/60 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>To</span>
                  {toCode === homeCurrency && (
                    <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                      HOME CURRENCY
                    </span>
                  )}
                  {toCode === destinationCurrency && toCode !== homeCurrency && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                      LOCAL DESTINATION
                    </span>
                  )}
                </span>

                <div className="w-36 sm:w-44">
                  <SearchableCurrencySelect
                    compact
                    dropdownAlign="right"
                    value={toCode}
                    onChange={(code) => setToCode(code)}
                  />
                </div>
              </div>

              {/* Converted Amount Output */}
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold text-primary">{toInfo.symbol}</span>
                <div className="w-full font-bold text-2xl sm:text-3xl text-primary tracking-tight truncate">
                  {effectiveConverted.toLocaleString('en-US', {
                    minimumFractionDigits: toInfo.precision,
                    maximumFractionDigits: toInfo.precision,
                  })}
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>{toInfo.name}</span>
                {cardFeePercent > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    +{cardFeePercent}% bank fee incl.
                  </span>
                )}
                {cardFeePercent === 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    0% Interbank mid-market
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Denomination Chips for Travelers */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">touch_app</span>
                <span>Common Travel Expenses in {fromInfo.code}:</span>
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Tap to convert instantly
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(fromInfo.sampleItems || [
                { amount: 10, label: 'Small purchase' },
                { amount: 50, label: 'Meal' },
                { amount: 100, label: 'Hotel' },
              ]).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickChipSelect(item.amount)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-primary/10 dark:bg-slate-800 dark:hover:bg-primary/20 text-slate-800 dark:text-slate-200 hover:text-primary dark:hover:text-primary transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-primary/30"
                >
                  <span className="font-bold">
                    {fromInfo.symbol}
                    {item.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    ({item.label})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Rate Benchmark Banner & Action Buttons */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Mid-Market Conversion Rate
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  1 {fromCode} ={' '}
                  <strong className="text-primary font-bold">
                    {exchangeRate < 1 ? exchangeRate.toFixed(4) : exchangeRate.toFixed(2)} {toCode}
                  </strong>{' '}
                  <span className="text-slate-400 font-normal">
                    (1 {toCode} = {inverseRate < 1 ? inverseRate.toFixed(4) : inverseRate.toFixed(2)}{' '}
                    {fromCode})
                  </span>
                </span>
              </div>
            </div>

            {/* Actions: Insert into Add Expense Form */}
            <div className="flex items-center gap-2">
              {onApplyToExpenseDraft && (
                <button
                  type="button"
                  onClick={() => {
                    // If fromCode is USD, pass converted or raw; otherwise pass corresponding home/local values
                    const noteText = `Converted ${fromInfo.symbol}${numFrom} ${fromCode} at 1 ${fromCode}=${exchangeRate.toFixed(
                      4
                    )} ${toCode}`;
                    onApplyToExpenseDraft(
                      fromCode === 'USD' ? numFrom : effectiveConverted,
                      'USD',
                      noteText
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary-container text-white font-semibold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">post_add</span>
                  <span>Apply to Add Expense Draft</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: Pocket Cheat Sheet (Reference Table) */}
      {activeTab === 'cheatsheet' && (
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Quick offline reference cheat-sheet for {fromCode} ({fromInfo.name}) to {toCode} (
              {toInfo.name})
            </span>
            <span className="font-mono text-[11px]">Updated {formattedTime}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 5, 10, 50, 100, 500, 1000, 5000, 10000, 20000, 50000, 100000]
              .filter((val) => {
                // Adjust scale based on currency precision
                if (fromInfo.precision === 0) return val >= 100;
                return val <= 1000;
              })
              .slice(0, 8)
              .map((amt) => {
                const converted = amt * exchangeRate;
                return (
                  <div
                    key={amt}
                    onClick={() => {
                      setFromAmountStr(amt.toString());
                      setActiveTab('converter');
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col hover:border-primary/50 transition-colors cursor-pointer group"
                  >
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                      {fromInfo.symbol}
                      {amt.toLocaleString()} {fromCode}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      ≈ {toInfo.symbol}
                      {converted.toLocaleString('en-US', {
                        minimumFractionDigits: toInfo.precision,
                        maximumFractionDigits: toInfo.precision,
                      })}
                    </span>
                  </div>
                );
              })}
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">
              lightbulb
            </span>
            <span>
              Tip: Click any denomination tile above to instantly load it into the converter!
            </span>
          </div>
        </div>
      )}

      {/* Main Tab 3: Card FX Fee Simulator */}
      {activeTab === 'fx-info' && (
        <div className="flex flex-col gap-3 mt-3">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Simulate the true cost of foreign transactions based on the card or payment method you
            use while traveling abroad:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                percent: 0,
                name: 'Fee-Free Travel Card',
                badge: 'Recommended',
                desc: 'e.g. Charles Schwab, Wise, Chase Sapphire',
              },
              {
                percent: 1.5,
                name: 'Foreign ATM / Debit',
                badge: '1.5% Fee',
                desc: 'Typical debit card overseas withdrawal markup',
              },
              {
                percent: 3.0,
                name: 'Standard Credit Card',
                badge: '3.0% Fee',
                desc: 'Standard non-travel card foreign transaction fee',
              },
            ].map((tier) => (
              <button
                key={tier.percent}
                type="button"
                onClick={() => setCardFeePercent(tier.percent)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  cardFeePercent === tier.percent
                    ? 'bg-primary/5 dark:bg-primary/20 border-primary ring-1 ring-primary/40'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {tier.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      tier.percent === 0
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tier.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{tier.desc}</p>
                <div className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  Effective Cost:{' '}
                  <span className="text-primary">
                    {toInfo.symbol}
                    {(rawConverted * (1 + tier.percent / 100)).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              Current Card Fee on {fromInfo.symbol}
              {numFrom.toLocaleString()} {fromCode}:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {cardFeePercent === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">$0.00 (Zero fees)</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  +{toInfo.symbol}
                  {feeAmount.toFixed(2)} {toCode} ({cardFeePercent}% surcharge)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Footer Info: Rate source timestamp & live note */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-emerald-500">info</span>
          <span>Approximate mid-market quote • For informational reference</span>
        </div>
        <div>Last updated at {formattedTime} (approximate rates feed)</div>
      </div>
    </div>
  );
};

export function getTripDestinationCurrency(trip?: { id?: string; country?: string; currency?: string } | null): string {
  if (!trip) return 'JPY';
  const c = (trip.country || '').toLowerCase();
  const id = (trip.id || '').toLowerCase();
  if (c.includes('japan') || id.includes('kyoto') || id.includes('tokyo')) return 'JPY';
  if (c.includes('italy') || id.includes('amalfi')) return 'EUR';
  if (c.includes('scotland') || c.includes('uk') || id.includes('highlands')) return 'GBP';
  if (c.includes('chile') || c.includes('argentina') || id.includes('patagonia')) return 'CLP';
  return trip.currency && SUPPORTED_CURRENCIES[trip.currency] ? trip.currency : 'USD';
}

export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const info = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
  return `${info.symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: info.precision,
    maximumFractionDigits: info.precision,
  })}`;
}

