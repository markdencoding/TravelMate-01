'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PlaceSuggestion, PlaceKind } from '@/lib/validators/suggestions';

export interface PlaceSearchInputProps {
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSelectSuggestion: (suggestion: PlaceSuggestion) => void;
  onSubmitQuery?: (query: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  value?: string;
  onChange?: (val: string) => void;
  id?: string;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return (
    <>
      {before}
      <strong className="font-semibold text-slate-900 dark:text-white underline decoration-primary/40 underline-offset-2">
        {match}
      </strong>
      {after}
    </>
  );
}

function getIconByKind(kind: PlaceKind): string {
  switch (kind) {
    case 'country':
      return 'public';
    case 'region':
      return 'map';
    case 'city':
      return 'location_city';
    case 'landmark':
      return 'account_balance';
    default:
      return 'location_on';
  }
}

export const PlaceSearchInput: React.FC<PlaceSearchInputProps> = ({
  placeholder = 'Search destinations, cities, or countries...',
  className = '',
  inputClassName = '',
  onSelectSuggestion,
  onSubmitQuery,
  disabled = false,
  autoFocus = false,
  value: controlledValue,
  onChange: controlledOnChange,
  id = 'place-search-input',
}) => {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = controlledValue !== undefined;
  const searchTerm = isControlled ? controlledValue : internalValue;

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState('');

  // In-memory per-session cache (persists across re-renders without external state)
  const sessionCache = useRef<Map<string, PlaceSuggestion[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeQueryRef = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateSearchTerm = (val: string) => {
    if (isControlled && controlledOnChange) {
      controlledOnChange(val);
    } else {
      setInternalValue(val);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch suggestions with debounce and cache
  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setErrorNotice(null);
      setHighlightedIndex(-1);
      return;
    }

    const cacheKey = trimmed.toLowerCase();

    // Check in-memory session cache
    if (sessionCache.current.has(cacheKey)) {
      const cached = sessionCache.current.get(cacheKey) || [];
      setSuggestions(cached);
      setIsOpen(true);
      setIsLoading(false);
      setErrorNotice(null);
      setHighlightedIndex(-1);
      setAnnouncement(`${cached.length} location suggestions available.`);
      return;
    }

    // Abort previous inflight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    activeQueryRef.current = trimmed;

    setIsLoading(true);
    setErrorNotice(null);

    try {
      const res = await fetch(
        `/api/places/suggest?q=${encodeURIComponent(trimmed)}`,
        { signal: controller.signal }
      );

      // Stale response check: ignore if user typed something newer
      if (activeQueryRef.current !== trimmed) {
        return;
      }

      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error) {
          setErrorNotice(data.error);
        } else {
          setErrorNotice('Suggestions unavailable. Press Enter to search');
        }
        setSuggestions([]);
        setIsOpen(true);
        setAnnouncement('Suggestions unavailable. Press Enter to search');
      } else {
        const results: PlaceSuggestion[] = data.suggestions || [];
        sessionCache.current.set(cacheKey, results);
        setSuggestions(results);
        setIsOpen(true);
        setErrorNotice(null);
        setAnnouncement(`${results.length} suggestions available.`);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was aborted, ignore quietly
      }
      if (activeQueryRef.current === trimmed) {
        setErrorNotice('Suggestions unavailable. Press Enter to search');
        setSuggestions([]);
        setIsOpen(true);
        setAnnouncement('Suggestions unavailable. Press Enter to search');
      }
    } finally {
      if (activeQueryRef.current === trimmed) {
        setIsLoading(false);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateSearchTerm(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 2) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setErrorNotice(null);
      setHighlightedIndex(-1);
      return;
    }

    // Debounce at 250ms
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 250);
  };

  const handleSelect = (item: PlaceSuggestion) => {
    onSelectSuggestion(item);
    updateSearchTerm('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && suggestions.length > 0) {
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
      if (suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // If an item is highlighted, select it
      if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex]);
      } else {
        // Immediate submit with current query, skipping debounce
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        setIsOpen(false);
        if (onSubmitQuery && searchTerm.trim()) {
          onSubmitQuery(searchTerm.trim());
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      {/* Input Field with Combobox semantics */}
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3.5 text-slate-400 pointer-events-none text-lg">
          search
        </span>

        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="place-suggestions-list"
          aria-activedescendant={
            highlightedIndex >= 0 ? `suggestion-opt-${highlightedIndex}` : undefined
          }
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchTerm.trim().length >= 2 && (suggestions.length > 0 || errorNotice)) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck="false"
          className={`w-full pl-10 pr-10 py-2.5 bg-surface-container-low dark:bg-surface-container border border-surface-container-high dark:border-outline-variant rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs ${inputClassName}`}
        />

        {/* Inline Status (Loading spinner or Enter search button) */}
        <div className="absolute right-3 flex items-center gap-1.5">
          {isLoading ? (
            <div
              className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
              aria-label="Loading suggestions"
            />
          ) : searchTerm.trim().length > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (onSubmitQuery) onSubmitQuery(searchTerm.trim());
                setIsOpen(false);
              }}
              title="Search (Enter)"
              className="text-on-surface-variant/60 hover:text-primary transition-colors flex items-center justify-center p-0.5 rounded-md"
            >
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown Listbox */}
      {isOpen && (
        <div
          id="place-suggestions-list"
          role="listbox"
          aria-label="Location suggestions"
          className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-surface dark:bg-surface-container-high border border-surface-container-high dark:border-outline-variant rounded-xl shadow-xl overflow-hidden max-h-72 flex flex-col animate-in fade-in-50 zoom-in-95 duration-100"
        >
          <div className="overflow-y-auto max-h-56 divide-y divide-surface-container-high/60 dark:divide-outline-variant/40 custom-scrollbar">
            {/* Error / Fallback State */}
            {errorNotice && (
              <button
                type="button"
                onClick={() => {
                  if (onSubmitQuery) onSubmitQuery(searchTerm.trim());
                  setIsOpen(false);
                }}
                className="w-full text-left px-3.5 py-3 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-amber-500 shrink-0">
                  info
                </span>
                <div className="truncate">
                  <span className="font-medium block">{errorNotice}</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400">
                    Click or press Enter to search OpenStreetMap
                  </span>
                </div>
              </button>
            )}

            {/* Empty State */}
            {!isLoading && !errorNotice && suggestions.length === 0 && (
              <div className="px-4 py-4 text-center text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-xl mb-1 block opacity-60">
                  location_off
                </span>
                No places found for &quot;{searchTerm.trim()}&quot;
              </div>
            )}

            {/* Suggestions List */}
            {suggestions.map((item, index) => {
              const isHighlighted = highlightedIndex === index;
              return (
                <div
                  key={item.id || `${item.name}-${index}`}
                  id={`suggestion-opt-${index}`}
                  role="option"
                  aria-selected={isHighlighted}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`min-h-[44px] px-3.5 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isHighlighted
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                      : 'hover:bg-surface-container-low dark:hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isHighlighted
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {getIconByKind(item.kind)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-on-surface truncate">
                      <HighlightMatch text={item.name} query={searchTerm.trim()} />
                    </div>
                    {item.secondaryText && (
                      <span className="text-[11px] text-on-surface-variant block truncate">
                        {item.secondaryText}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] uppercase font-bold tracking-wider text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-container-highest shrink-0">
                    {item.kind}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Muted Attribution Footer (Required by Geoapify & OSM) */}
          <div className="px-3.5 py-2 bg-surface-container-low dark:bg-surface-container border-t border-surface-container-high dark:border-outline-variant text-[10px] text-on-surface-variant flex items-center justify-between shrink-0 select-none">
            <span>
              Powered by{' '}
              <a
                href="https://www.geoapify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                Geoapify
              </a>
            </span>
            <span className="text-on-surface-variant">
              © OpenStreetMap contributors
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
