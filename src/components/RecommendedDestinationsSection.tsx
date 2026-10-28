'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getTravelerRecommendations,
  type TravelerDestinationRecommendation,
} from '@/lib/recommendations';
import type { PlaceCategory } from '@/lib/validators/places';
import type { RecommendationCategoryFilter } from '@/lib/validators/recommendations';

export interface RecommendedDestinationsSectionProps {
  activeDestinationId: string;
  onPreviewDestination: (dest: TravelerDestinationRecommendation) => void;
  onPlanTrip: (dest: TravelerDestinationRecommendation) => void;
}

const COUNTRY_FILTERS: { id: string; label: string }[] = [
  { id: 'all', label: 'Featured' },
  { id: 'Philippines', label: 'Philippines' },
  { id: 'Japan', label: 'Japan' },
  { id: 'South Korea', label: 'South Korea' },
  { id: 'Thailand', label: 'Thailand' },
  { id: 'Italy', label: 'Italy' },
];

const CATEGORY_FILTERS: {
  id: RecommendationCategoryFilter;
  label: string;
  icon: string;
}[] = [
  { id: 'all', label: 'All Styles', icon: 'apps' },
  { id: 'nature', label: 'Nature', icon: 'park' },
  { id: 'culture', label: 'Culture & Heritage', icon: 'account_balance' },
  { id: 'food', label: 'Food & Dining', icon: 'restaurant' },
  { id: 'attractions', label: 'Attractions', icon: 'photo_camera' },
];

const CATEGORY_ICONS: Record<PlaceCategory, string> = {
  nature: 'park',
  culture: 'account_balance',
  food: 'restaurant',
  attractions: 'photo_camera',
  landmark: 'location_city',
};

export const RecommendedDestinationsSection: React.FC<
  RecommendedDestinationsSectionProps
> = ({ activeDestinationId, onPreviewDestination, onPlanTrip }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] =
    useState<RecommendationCategoryFilter>('all');
  const [destinations, setDestinations] = useState<
    TravelerDestinationRecommendation[]
  >(() => getTravelerRecommendations({ country: 'all', category: 'all' }));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  const clientCacheRef = useRef<
    Map<string, TravelerDestinationRecommendation[]>
  >(new Map());

  const loadRecommendations = useCallback(
    async (
      country: string,
      category: RecommendationCategoryFilter,
      signal: AbortSignal,
      bypassCache: boolean
    ) => {
      if (country === 'all') {
        setErrorMessage(null);
        setIsLoading(false);
        setDestinations(getTravelerRecommendations({ country: 'all', category }));
        return;
      }

      const cacheKey = `${country.toLowerCase()}|${category}`;
      if (!bypassCache && clientCacheRef.current.has(cacheKey)) {
        setErrorMessage(null);
        setIsLoading(false);
        setDestinations(clientCacheRef.current.get(cacheKey) || []);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams({
          mode: 'travelers',
          country,
          category,
        });
        const res = await fetch(`/api/recommendations?${params.toString()}`, {
          signal,
        });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data = (await res.json()) as {
          destinations?: TravelerDestinationRecommendation[];
        };
        const items = Array.isArray(data.destinations) ? data.destinations : [];
        clientCacheRef.current.set(cacheKey, items);
        if (!signal.aborted) {
          setDestinations(items);
        }
      } catch (err: unknown) {
        if (signal.aborted) return;
        const message =
          err instanceof Error && err.name === 'AbortError'
            ? null
            : `Could not load live recommendations for ${country}. Check your connection or try again.`;
        if (message) {
          setErrorMessage(message);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    loadRecommendations(
      selectedCountry,
      selectedCategory,
      controller.signal,
      reloadToken > 0
    );
    return () => controller.abort();
  }, [selectedCountry, selectedCategory, reloadToken, loadRecommendations]);

  const handleResetFilters = () => {
    setSelectedCountry('all');
    setSelectedCategory('all');
    setErrorMessage(null);
  };

  const activeCategoryLabel =
    CATEGORY_FILTERS.find((c) => c.id === selectedCategory)?.label || 'selected';

  return (
    <section
      id="recommended-destinations"
      aria-labelledby="recommended-destinations-heading"
      className="py-12 md:py-16 bg-surface-container-low/50 dark:bg-slate-900/35 border-b border-surface-container-high/60 dark:border-slate-800 w-full max-w-full"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
          <div className="max-w-2xl">
            <h2
              id="recommended-destinations-heading"
              className="text-xl sm:text-2xl lg:text-3xl font-black font-display tracking-tight text-on-surface"
            >
              Recommended Destinations for Travelers
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Filter places by country or travel interest, preview their coordinates and 5-day Open-Meteo weather below, or start an itinerary calibrated in Philippine Pesos (₱).
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter recommended destinations by country"
            className="flex flex-wrap items-center gap-2"
          >
            {COUNTRY_FILTERS.map((countryItem) => {
              const isSelected = selectedCountry === countryItem.id;
              return (
                <button
                  key={countryItem.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCountry(countryItem.id)}
                  className={`min-h-11 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'bg-surface-container-lowest dark:bg-slate-900 text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-surface-container-high dark:border-slate-700'
                  }`}
                >
                  {countryItem.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="group"
          aria-label="Filter recommended destinations by travel style"
          className="flex flex-wrap items-center gap-2 mb-7 pb-5 border-b border-surface-container-high/60 dark:border-slate-800"
        >
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-11 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isSelected
                    ? 'bg-primary-fixed text-on-primary-fixed-variant dark:bg-primary/20 dark:text-primary border border-primary/40 font-bold'
                    : 'bg-surface-container-lowest dark:bg-slate-900/80 text-on-surface-variant hover:text-on-surface border border-surface-container-high/80 dark:border-slate-800'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[17px]"
                >
                  {cat.icon}
                </span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {errorMessage && !isLoading && (
          <div
            role="alert"
            className="rounded-2xl p-5 bg-surface-container-lowest dark:bg-slate-900 border border-error/40 text-on-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-error text-[22px] shrink-0 mt-0.5"
              >
                error
              </span>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  Unable to load country recommendations
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {errorMessage}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setReloadToken((n) => n + 1)}
                className="min-h-11 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="min-h-11 px-4 py-2 rounded-xl bg-surface-container dark:bg-slate-800 text-on-surface text-xs font-bold border border-surface-container-high dark:border-slate-700 hover:bg-surface-container-high transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Show Featured
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div role="status" aria-live="polite" className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[18px] animate-spin"
              >
                progress_activity
              </span>
              <span>
                Loading recommended destinations for {selectedCountry}...
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[0, 1, 2].map((skeletonIdx) => (
                <div
                  key={skeletonIdx}
                  className="rounded-2xl p-5 bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 animate-pulse space-y-3"
                >
                  <div className="h-5 w-28 rounded-full bg-surface-container-high dark:bg-slate-800" />
                  <div className="h-6 w-3/5 rounded-lg bg-surface-container-high dark:bg-slate-800" />
                  <div className="h-4 w-full rounded-lg bg-surface-container dark:bg-slate-800/70" />
                  <div className="h-4 w-4/5 rounded-lg bg-surface-container dark:bg-slate-800/70" />
                  <div className="pt-3 flex gap-2">
                    <div className="h-11 flex-1 rounded-xl bg-surface-container-high dark:bg-slate-800" />
                    <div className="h-11 flex-1 rounded-xl bg-surface-container-high dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && !errorMessage && destinations.length === 0 && (
          <div className="rounded-2xl p-6 sm:p-8 bg-surface-container-lowest dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 text-center max-w-xl mx-auto">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-primary text-[28px]"
            >
              travel_explore
            </span>
            <h3 className="text-base font-bold font-display text-on-surface mt-2">
              No matching destinations for this filter combination
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              We do not have {activeCategoryLabel.toLowerCase()} picks listed under{' '}
              {selectedCountry === 'all' ? 'Featured' : selectedCountry} yet. Reset the filters to browse all recommended stops.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 min-h-11 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* 5-card featured view spans 2 cols on card 0 so 2-col and 3-col rows stay even without orphan cells. */}
        {!isLoading && !errorMessage && destinations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {destinations.map((dest, index) => {
              const isSpotlight =
                index === 0 &&
                selectedCountry === 'all' &&
                selectedCategory === 'all' &&
                destinations.length >= 5;
              const isActive = dest.id === activeDestinationId;
              const categoryIcon = CATEGORY_ICONS[dest.category] || 'place';

              return (
                <article
                  key={dest.id}
                  className={`@container rounded-2xl p-5 sm:p-6 bg-surface-container-lowest dark:bg-slate-900 border transition-shadow flex flex-col justify-between gap-4 ${
                    isSpotlight ? 'md:col-span-2 lg:col-span-2' : ''
                  } ${
                    isActive
                      ? 'border-primary ring-2 ring-primary/25 shadow-md'
                      : 'border-surface-container-high dark:border-slate-800 shadow-xs hover:border-primary/50'
                  }`}
                >
                  <header className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant dark:bg-primary/15 dark:text-primary text-[11px] font-bold font-display">
                        <span
                          aria-hidden="true"
                          className="material-symbols-outlined text-[14px]"
                        >
                          {categoryIcon}
                        </span>
                        <span>{dest.categoryLabel}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-on-primary text-[11px] font-bold">
                            <span
                              aria-hidden="true"
                              className="material-symbols-outlined text-[13px]"
                            >
                              check_circle
                            </span>
                            <span>Active on Map</span>
                          </span>
                        )}
                        <span className="text-[11px] font-mono font-semibold text-on-surface-variant">
                          Local: {dest.currency}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-primary">
                        {dest.region} • {dest.country}
                      </p>
                      <h3
                        className={`font-black font-display text-on-surface tracking-tight mt-0.5 ${
                          isSpotlight ? 'text-xl sm:text-2xl' : 'text-lg'
                        }`}
                      >
                        {dest.name}
                      </h3>
                    </div>
                  </header>

                  {/* Container query splits summary and landmarks only when the card itself is wide enough. */}
                  <div className="grid grid-cols-1 @lg:grid-cols-12 gap-4 items-start">
                    <div
                      className={
                        isSpotlight
                          ? '@lg:col-span-7 space-y-3'
                          : 'col-span-full space-y-3'
                      }
                    >
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                        {dest.summary}
                      </p>

                      {isSpotlight && (
                        <p className="text-xs text-on-surface bg-surface-container-low dark:bg-slate-800/80 border border-surface-container-high/70 dark:border-slate-700/70 rounded-xl p-3">
                          <span className="font-bold text-primary">
                            Packing tip:{' '}
                          </span>
                          <span className="text-on-surface-variant">
                            {dest.clothingTip}
                          </span>
                        </p>
                      )}
                    </div>

                    <div
                      className={
                        isSpotlight ? '@lg:col-span-5' : 'col-span-full'
                      }
                    >
                      <p className="text-[11px] font-bold text-on-surface mb-1.5">
                        Notable Stops
                      </p>
                      <ul className="flex flex-wrap gap-1.5" aria-label={`Notable stops in ${dest.name}`}>
                        {dest.highlights.map((landmark) => (
                          <li
                            key={landmark}
                            className="px-2.5 py-1 rounded-lg bg-surface-container-low dark:bg-slate-800 text-on-surface text-xs font-medium border border-surface-container-high/70 dark:border-slate-700/70"
                          >
                            {landmark}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <footer className="mt-auto pt-3.5 border-t border-surface-container-high/60 dark:border-slate-800 flex flex-col @sm:flex-row items-stretch @sm:items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onPreviewDestination(dest)}
                      className={`min-h-11 flex-1 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        isActive
                          ? 'bg-primary-fixed text-on-primary-fixed-variant dark:bg-primary/20 dark:text-primary border border-primary/40'
                          : 'bg-surface-container-low dark:bg-slate-800 hover:bg-surface-container text-on-surface border border-surface-container-high dark:border-slate-700'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-[17px] text-primary"
                      >
                        map
                      </span>
                      <span>
                        {isActive ? 'Viewing Map & Weather' : 'Preview Map & Weather'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onPlanTrip(dest)}
                      className="min-h-11 flex-1 px-3.5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-[17px]"
                      >
                        edit_calendar
                      </span>
                      <span>Plan a Trip Here</span>
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-5 text-xs text-on-surface-variant">
          Note: Destination coordinates, regional landmarks, and weather outlooks come from third-party open data providers (OpenStreetMap, Wikidata, and Open-Meteo) and may occasionally be inaccurate.
        </p>
      </div>
    </section>
  );
};
