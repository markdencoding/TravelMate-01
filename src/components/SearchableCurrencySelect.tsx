'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CURRENCY_LIST, getCurrencyInfo, CurrencyInfo } from '../lib/currencies';

interface SearchableCurrencySelectProps {
  value: string;
  onChange: (code: string, info: CurrencyInfo) => void;
  id?: string;
  name?: string;
  label?: string;
  compact?: boolean;
  dropdownAlign?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export const SearchableCurrencySelect: React.FC<SearchableCurrencySelectProps> = ({
  value,
  onChange,
  id,
  name,
  label,
  compact = false,
  dropdownAlign = 'left',
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCurrency = useMemo(() => getCurrencyInfo(value), [value]);

  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CURRENCY_LIST;
    return CURRENCY_LIST.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Click outside and Escape listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (currency: CurrencyInfo) => {
    onChange(currency.code, currency);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Trigger Button */}
      <button
        id={id}
        name={name}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || label || `Currency: ${selectedCurrency.code}`}
        className={`w-full flex items-center justify-between gap-2 rounded-lg text-on-surface transition-all cursor-pointer border border-transparent focus:outline-none focus:ring-2 focus:ring-primary ${
          compact
            ? 'h-[44px] px-2.5 py-1.5 text-xs bg-surface-container-low dark:bg-slate-800'
            : 'h-[44px] px-3 py-2 text-sm bg-surface-container-low focus:bg-surface-container-lowest'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-surface-container-high'}`}
      >
        <span className="flex items-center gap-2 min-w-0 truncate">
          <span className="text-base shrink-0 leading-none" role="img" aria-label={selectedCurrency.name}>
            {selectedCurrency.flag}
          </span>
          <span className="font-bold text-on-surface truncate">
            {selectedCurrency.code}
          </span>
          <span className="text-on-surface-variant font-medium shrink-0">
            ({selectedCurrency.symbol})
          </span>
          {!compact && (
            <span className="text-on-surface-variant text-xs truncate hidden sm:inline">
              - {selectedCurrency.name}
            </span>
          )}
        </span>

        <span
          className={`material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select currency"
          className={`absolute top-full mt-1.5 z-50 w-full min-w-[260px] max-w-[340px] bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high rounded-xl shadow-xl overflow-hidden animate-fade-in flex flex-col ${
            dropdownAlign === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Search Header */}
          <div className="p-2 border-b border-surface-container-high/60 bg-surface-container-low/50 dark:bg-slate-800/50 shrink-0">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code, name, symbol..."
                className="w-full h-9 pl-8 pr-7 bg-surface rounded-lg text-xs font-body text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 p-0.5 text-on-surface-variant hover:text-on-surface rounded-full cursor-pointer"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Currency Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-surface-container-high/20 custom-scrollbar p-1">
            {filteredCurrencies.length === 0 ? (
              <div className="p-4 text-center text-xs text-on-surface-variant">
                No matching currencies found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredCurrencies.map((curr) => {
                const isSelected = curr.code === selectedCurrency.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(curr)}
                    className={`w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold dark:bg-primary/20'
                        : 'text-on-surface hover:bg-surface-container-low dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-base shrink-0 leading-none">{curr.flag}</span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-on-surface">{curr.code}</span>
                          <span className="text-[11px] text-on-surface-variant font-mono">
                            {curr.symbol}
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant truncate">
                          {curr.name}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                        check
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Counter Footer */}
          <div className="px-3 py-1.5 border-t border-surface-container-high/40 bg-surface-container-low/40 dark:bg-slate-800/40 text-[10px] text-on-surface-variant flex items-center justify-between shrink-0">
            <span>{filteredCurrencies.length} currencies available</span>
            <span>All rates calibrated</span>
          </div>
        </div>
      )}
    </div>
  );
};
