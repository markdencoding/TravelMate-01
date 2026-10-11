'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTravelStore } from '../store';
import { PlaceItem, PlaceCategory } from '@/lib/validators/places';
import { TrimmedWeatherResponse } from '@/lib/validators/weather';
import { fetchRealWeather } from '@/services/weatherApi';
import { addDestinationAction } from '@/app/actions/destinations';
import { FullscreenMapModal } from '../components/FullscreenMapModal';
import { PlaceSearchInput } from '@/components/PlaceSearchInput';
import type { PlaceSuggestion } from '@/lib/validators/suggestions';

// Dynamically load client-only Leaflet map to prevent SSR window reference errors
const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-container flex flex-col items-center justify-center gap-2 text-on-surface-variant">
      <span className="material-symbols-outlined text-[36px] animate-spin text-primary">progress_activity</span>
      <span className="text-xs font-semibold">Loading interactive map...</span>
    </div>
  ),
});

export const ExploreMapScreen: React.FC = () => {
  const { trips, activeTripId, setActiveTab } = useTravelStore();

  // Search State
  const [searchInput, setSearchInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Filter & Selection State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'name'>('relevance');

  // Weather State
  const [weatherData, setWeatherData] = useState<TrimmedWeatherResponse | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Add to Trip State
  const [targetTripId, setTargetTripId] = useState<string>(activeTripId || (trips[0]?.id ?? ''));
  const [isAdding, setIsAdding] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Fullscreen Modal State
  const [isFullscreenMapOpen, setIsFullscreenMapOpen] = useState(false);

  // Sync active trip if trips change
  useEffect(() => {
    if (!targetTripId && trips.length > 0) {
      setTargetTripId(trips[0].id);
    }
  }, [trips, targetTripId]);

  // Selected place object
  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) || null,
    [places, selectedPlaceId]
  );

  // Load weather when selected place changes
  useEffect(() => {
    if (!selectedPlace) {
      setWeatherData(null);
      setWeatherError(null);
      return;
    }

    let isMounted = true;
    setIsWeatherLoading(true);
    setWeatherError(null);

    fetchRealWeather(selectedPlace.latitude, selectedPlace.longitude)
      .then((data) => {
        if (isMounted) {
          setWeatherData(data);
          setIsWeatherLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Failed to load weather:', err);
          setWeatherError('Weather unavailable');
          setIsWeatherLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedPlace?.id, selectedPlace?.latitude, selectedPlace?.longitude]);

  // Keyboard shortcut: Press 'F' to open full map, Escape to dismiss selected spot
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'Escape') {
        setSelectedPlaceId('');
        setIsFullscreenMapOpen(false);
      }
      if (e.key === 'f' || e.key === 'F') {
        setIsFullscreenMapOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Search Handler (Runs on submit only, NOT on keystroke)
  const handleSearch = useCallback(
    async (queryToSearch: string) => {
      const clean = queryToSearch.trim();
      if (!clean) return;

      setIsSearching(true);
      setSearchError(null);
      setSelectedPlaceId('');
      setWeatherData(null);
      setSubmittedQuery(clean);

      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(clean)}`);
        const json = await res.json();

        if (!res.ok) {
          setSearchError(json.error || `Search failed with status ${res.status}`);
          setPlaces([]);
          setHasSearched(true);
          return;
        }

        const returnedPlaces: PlaceItem[] = json.places || [];
        setPlaces(returnedPlaces);
        setHasSearched(true);

        if (returnedPlaces.length > 0) {
          // Auto-select the first result to showcase place & weather
          setSelectedPlaceId(returnedPlaces[0].id);
        }
      } catch (err: any) {
        console.error('Place search request error:', err);
        setSearchError('Network error. Please check your connection and try again.');
        setPlaces([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: PlaceSuggestion) => {
      setSubmittedQuery(suggestion.name);
      setHasSearched(true);
      setIsSearching(false);
      setSearchError(null);

      const placeItem: PlaceItem = {
        id: suggestion.id,
        name: suggestion.name,
        displayName: suggestion.secondaryText
          ? `${suggestion.name}, ${suggestion.secondaryText}`
          : suggestion.name,
        country: suggestion.country,
        category: suggestion.kind === 'landmark' ? 'landmark' : 'attractions',
        categoryLabel: suggestion.kind.toUpperCase(),
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        type: suggestion.kind,
        class: 'place',
      };

      setPlaces([placeItem]);
      setSelectedPlaceId(placeItem.id);

      // Trigger full background fetch for nearby attractions and weather
      handleSearch(suggestion.name);
    },
    [handleSearch]
  );

  const handleClearSearch = () => {
    setSearchInput('');
    setSubmittedQuery('');
    setPlaces([]);
    setHasSearched(false);
    setSelectedPlaceId('');
    setSearchError(null);
    setWeatherData(null);
  };

  const handleConfirmAdd = async (placeToAdd?: PlaceItem | null) => {
    const target = placeToAdd || selectedPlace;
    if (!target) return;

    if (!targetTripId) {
      setAddError('Please create or select a trip first.');
      return;
    }

    setIsAdding(true);
    setAddError(null);

    const res = await addDestinationAction({
      tripId: targetTripId,
      name: target.name,
      country: target.country,
      latitude: target.latitude,
      longitude: target.longitude,
    });

    setIsAdding(false);

    if (!res.success) {
      setAddError(res.error || 'Failed to add place to trip.');
      return;
    }

    setShowAddSuccess(true);
    setTimeout(() => setShowAddSuccess(false), 2500);
  };

  // Filtered & Sorted Places
  const filteredPlaces = useMemo(() => {
    let result = places.filter((p) => {
      if (selectedCategory === 'all') return true;
      return p.category === selectedCategory;
    });

    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [places, selectedCategory, sortBy]);

  return (
    <div className="w-full flex flex-col gap-space-md">
      {/* Top Context & Action Area */}
      <div className="px-space-md sm:px-space-lg pt-space-md pb-space-sm bg-surface">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs font-caption text-caption text-on-surface-variant mb-space-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="hover:text-primary transition-colors cursor-pointer"
            type="button"
          >
            Home
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-body-medium font-semibold">Explore / Map</span>
        </nav>

        {/* Header Titles & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md mb-space-md">
          <div className="max-w-2xl">
            <h1 className="font-page-title text-page-title text-on-surface tracking-tight font-bold">
              Explore Destinations &amp; Places
            </h1>
            <p className="font-body text-body text-on-surface-variant mt-space-xs">
              Search real destinations worldwide, inspect live Open-Meteo forecasts, and bookmark spots directly into your trips.
            </p>
          </div>

          {/* Search Form & Fullscreen Trigger */}
          <div className="flex items-center gap-space-sm w-full lg:w-auto">
            <div className="relative w-full lg:w-[380px] z-20">
              <PlaceSearchInput
                id="explore-place-search-input"
                placeholder="Search city, landmark, region..."
                onSelectSuggestion={handleSelectSuggestion}
                onSubmitQuery={handleSearch}
              />
            </div>

            {/* View Fullscreen Map Button */}
            <button
              onClick={() => setIsFullscreenMapOpen(true)}
              type="button"
              className="h-[42px] px-3.5 bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-surface-container-high/60 font-button text-caption rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap font-semibold shrink-0"
              title="Expand to Fullscreen Map [Press F]"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">open_in_full</span>
              <span className="hidden sm:inline">Full Map</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-container-high text-on-surface-variant">
                F
              </kbd>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        {hasSearched && places.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-space-sm no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`h-7 px-3.5 rounded-full font-badge text-badge flex items-center gap-1 shadow-xs whitespace-nowrap cursor-pointer font-bold transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-surface-container-high/40'
              }`}
              type="button"
            >
              <span>ALL PLACES ({places.length})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('attractions')}
              className={`h-7 px-3.5 rounded-full font-badge text-badge flex items-center gap-1 whitespace-nowrap cursor-pointer font-bold transition-colors ${
                selectedCategory === 'attractions'
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'bg-[#EDE9FE] text-[#6D28D9] dark:bg-purple-950/40 dark:text-purple-300 hover:brightness-95'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">local_activity</span>
              <span>ATTRACTIONS</span>
            </button>
            <button
              onClick={() => setSelectedCategory('food')}
              className={`h-7 px-3.5 rounded-full font-badge text-badge flex items-center gap-1 whitespace-nowrap cursor-pointer font-bold transition-colors ${
                selectedCategory === 'food'
                  ? 'bg-[#B45309] text-white shadow-xs'
                  : 'bg-[#FEF3C7] text-[#B45309] dark:bg-amber-950/40 dark:text-amber-300 hover:brightness-95'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">restaurant</span>
              <span>FOOD &amp; DINING</span>
            </button>
            <button
              onClick={() => setSelectedCategory('nature')}
              className={`h-7 px-3.5 rounded-full font-badge text-badge flex items-center gap-1 whitespace-nowrap cursor-pointer font-bold transition-colors ${
                selectedCategory === 'nature'
                  ? 'bg-[#047857] text-white shadow-xs'
                  : 'bg-[#D1FAE5] text-[#047857] dark:bg-emerald-950/40 dark:text-emerald-300 hover:brightness-95'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">forest</span>
              <span>NATURE</span>
            </button>
            <button
              onClick={() => setSelectedCategory('culture')}
              className={`h-7 px-3.5 rounded-full font-badge text-badge flex items-center gap-1 whitespace-nowrap cursor-pointer font-bold transition-colors ${
                selectedCategory === 'culture'
                  ? 'bg-[#005454] text-white shadow-xs'
                  : 'bg-surface-container-high text-primary hover:brightness-95'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">temple_buddhist</span>
              <span>CULTURE &amp; HERITAGE</span>
            </button>
          </div>
        )}
      </div>

      {/* Two-Column Responsive Layout */}
      <div className="px-space-md sm:px-space-lg pb-space-lg flex flex-col md:flex-row gap-space-md lg:gap-space-lg items-start">
        {/* Left Column: Results / Empty State (340px tablet, 440px desktop) */}
        <div className="w-full md:w-[340px] lg:w-[440px] shrink-0 flex flex-col gap-space-md">
          {/* Subheader when results exist */}
          {hasSearched && places.length > 0 && (
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex items-center gap-2">
                <span className="font-item-title text-item-title text-on-surface font-semibold truncate max-w-[220px]">
                  {submittedQuery}
                </span>
                <span className="font-caption text-caption px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-body-medium">
                  {filteredPlaces.length} found
                </span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant font-caption text-caption">
                <span className="material-symbols-outlined text-[16px] text-primary">sort</span>
                <select
                  aria-label="Sort destinations"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'relevance' | 'name')}
                  className="bg-transparent font-caption text-caption text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="name">Sort: Name (A-Z)</option>
                </select>
              </div>
            </div>
          )}

          {/* 1. INITIAL EMPTY STATE (Before search) */}
          {!hasSearched && !isSearching && (
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-surface-container-high/60 shadow-xs flex flex-col items-center text-center gap-space-sm py-12">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[36px]">travel_explore</span>
              </div>
              <h3 className="font-section-title text-section-title text-on-surface font-bold">
                Search for a destination to get started
              </h3>
              <p className="font-body text-body text-on-surface-variant max-w-sm text-balance">
                Enter a city, region, or landmark above to discover places via OpenStreetMap and inspect live weather forecasts.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {['Kyoto', 'Tokyo', 'Paris', 'Rome', 'New York'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setSearchInput(sample);
                      handleSearch(sample);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Try "{sample}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. LOADING STATE */}
          {isSearching && (
            <div className="flex flex-col gap-space-md">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest rounded-xl p-space-md border border-surface-container-high/40 animate-pulse flex gap-space-md"
                >
                  <div className="w-14 h-14 rounded-lg bg-surface-container shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-surface-container rounded w-3/4" />
                    <div className="h-3 bg-surface-container rounded w-1/2" />
                    <div className="h-3 bg-surface-container rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. SEARCH ERROR / RATE-LIMIT STATE */}
          {!isSearching && searchError && (
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-error/30 shadow-xs flex flex-col items-center text-center gap-space-sm py-10">
              <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>
              <h3 className="font-item-title text-item-title text-on-surface font-bold">
                Unable to load places
              </h3>
              <p className="font-caption text-caption text-on-surface-variant max-w-xs">
                {searchError}
              </p>
              <button
                type="button"
                onClick={() => handleSearch(submittedQuery || searchInput)}
                className="mt-2 px-4 py-2 bg-primary text-on-primary font-button text-caption rounded-xl font-semibold cursor-pointer hover:bg-primary-container transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* 4. NO RESULTS STATE */}
          {!isSearching && hasSearched && !searchError && places.length === 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-surface-container-high/60 shadow-xs flex flex-col items-center text-center gap-space-sm py-12">
              <div className="w-14 h-14 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px]">search_off</span>
              </div>
              <h3 className="font-section-title text-section-title text-on-surface font-bold">
                No places found
              </h3>
              <p className="font-body text-body text-on-surface-variant max-w-xs">
                We couldn't find any results for "{submittedQuery}". Try checking the spelling or searching for a broader city or country.
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Clear and search again
              </button>
            </div>
          )}

          {/* 5. SEARCH RESULTS LIST (Scrollable, Clean spacing) */}
          {!isSearching && hasSearched && filteredPlaces.length > 0 && (
            <div className="flex flex-col gap-space-sm max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
              {filteredPlaces.map((place, idx) => {
                const isSelected = selectedPlaceId === place.id;
                const iconName =
                  place.category === 'attractions'
                    ? 'local_activity'
                    : place.category === 'food'
                    ? 'restaurant'
                    : place.category === 'nature'
                    ? 'forest'
                    : place.category === 'culture'
                    ? 'temple_buddhist'
                    : 'location_on';

                return (
                  <div
                    key={place.id}
                    onClick={() => setSelectedPlaceId(place.id)}
                    className={`bg-surface-container-lowest rounded-xl p-3.5 sm:p-space-md transition-all cursor-pointer relative overflow-hidden border ${
                      isSelected
                        ? 'shadow-md ring-2 ring-primary border-primary bg-primary/5'
                        : 'shadow-xs hover:shadow-md border-surface-container-high/50 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start gap-space-md">
                      {/* Icon Avatar Badge */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-bold shadow-xs ${
                          place.category === 'attractions'
                            ? 'bg-[#6D28D9]'
                            : place.category === 'food'
                            ? 'bg-[#B45309]'
                            : place.category === 'nature'
                            ? 'bg-[#047857]'
                            : place.category === 'culture'
                            ? 'bg-[#005454]'
                            : 'bg-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px]">{iconName}</span>
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-1 min-w-0 justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-badge text-badge px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-surface-container-high text-primary">
                              {place.categoryLabel}
                            </span>
                            <span className="font-caption text-[11px] text-on-surface-variant font-mono font-bold">
                              #{String(idx + 1).padStart(2, '0')}
                            </span>
                          </div>

                          <h3 className="font-item-title text-item-title text-on-surface truncate font-semibold">
                            {place.name}
                          </h3>
                          <p className="font-caption text-caption text-on-surface-variant line-clamp-1 mt-0.5">
                            {place.country ? `${place.country} • ` : ''}
                            {place.displayName.split(',').slice(1, 3).join(',').trim()}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-surface-container-high/40">
                          {isSelected ? (
                            <span className="text-secondary font-badge text-badge uppercase flex items-center gap-1 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                              Viewing On Map
                            </span>
                          ) : (
                            <span className="font-caption text-caption text-on-surface-variant flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                              <span>Map Pin</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPlaceId(place.id);
                              handleConfirmAdd(place);
                            }}
                            className="h-7 px-3 bg-secondary hover:bg-secondary-container text-on-secondary font-button text-caption rounded-lg flex items-center gap-1 transition-colors shadow-xs cursor-pointer font-semibold"
                          >
                            <span className="material-symbols-outlined text-[15px]">add</span>
                            <span>+ Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Leaflet Map & Floating Place Overlay */}
        <div className="flex-1 w-full flex flex-col gap-space-md">
          {/* Map Container */}
          <div className="relative w-full h-[620px] rounded-2xl overflow-hidden shadow-sm bg-surface-container border border-surface-container-high/60">
            {/* Real Client-Side Leaflet Map */}
            <LeafletMap
              places={filteredPlaces}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={(p) => setSelectedPlaceId(p.id)}
              onMapClick={() => setSelectedPlaceId('')}
              className="w-full h-full"
            />

            {/* Top Right Tool: Fullscreen Trigger */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsFullscreenMapOpen(true)}
                aria-label="Expand map to full screen"
                className="h-9 px-3 bg-surface-container-lowest/90 backdrop-blur-md hover:bg-surface-container text-on-surface rounded-xl shadow-md border border-surface-container-high/60 cursor-pointer font-caption text-caption font-semibold flex items-center gap-1.5 transition-colors"
                title="Expand to Fullscreen Map [Press F]"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">fullscreen</span>
                <span>Full Map</span>
              </button>
            </div>

            {/* Selected Place Floating Drawer / Card */}
            {selectedPlace && (
              <div
                role="dialog"
                aria-label="Place details and weather"
                className="absolute bottom-4 left-4 right-4 md:right-auto md:w-full md:max-w-md bg-surface-container-lowest/95 backdrop-blur-xl rounded-2xl p-space-md shadow-2xl z-30 pointer-events-auto border border-surface-container-high/60 animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                {/* Header & Dismiss Buttons */}
                <div className="flex items-start justify-between gap-space-sm mb-space-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="bg-surface-container-high text-primary font-badge text-badge px-2 py-0.5 rounded-full font-bold uppercase">
                        {selectedPlace.categoryLabel}
                      </span>
                    </div>
                    <h2 className="font-section-title text-section-title text-on-surface font-bold truncate">
                      {selectedPlace.name}
                    </h2>
                    <p className="font-caption text-caption text-on-surface-variant line-clamp-1 mt-0.5">
                      {selectedPlace.displayName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setIsFullscreenMapOpen(true)}
                      aria-label="Inspect in full map"
                      title="Inspect in Full Map [Press F]"
                      className="text-on-surface-variant hover:text-primary min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-surface-container"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_full</span>
                    </button>
                    <button
                      onClick={() => setSelectedPlaceId('')}
                      aria-label="Close inspector"
                      className="text-on-surface-variant hover:text-on-surface min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-surface-container"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Real Live Weather Widget (Open-Meteo) */}
                <div className="bg-surface-container-low rounded-xl p-3 mb-space-sm">
                  {isWeatherLoading ? (
                    <div className="flex items-center gap-3 py-2 animate-pulse text-on-surface-variant text-xs">
                      <span className="material-symbols-outlined text-primary text-[22px] animate-spin">
                        progress_activity
                      </span>
                      <span>Fetching live Open-Meteo forecast...</span>
                    </div>
                  ) : weatherError ? (
                    <div className="flex items-center gap-2 py-1 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-amber-500 text-[18px]">cloud_off</span>
                      <span>Weather forecast temporarily unavailable</span>
                    </div>
                  ) : weatherData ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-primary text-[26px]">
                            {weatherData.icon}
                          </span>
                          <div>
                            <span className="font-body-medium text-small text-on-surface font-bold block">
                              {weatherData.currentTempC}°C • {weatherData.condition}
                            </span>
                            <span className="font-caption text-[11px] text-on-surface-variant">
                              Humidity: {weatherData.humidity}% • Wind: {weatherData.windKmh} km/h
                            </span>
                          </div>
                        </div>
                        <span className="bg-surface-container-lowest text-primary font-badge text-badge px-2 py-0.5 rounded shadow-xs font-bold shrink-0">
                          OPEN-METEO
                        </span>
                      </div>

                      {/* 5-Day Micro Weather Strip */}
                      {weatherData.forecast && weatherData.forecast.length > 0 && (
                        <div className="grid grid-cols-5 gap-1 pt-1.5 border-t border-surface-container-high/50 text-center">
                          {weatherData.forecast.slice(0, 5).map((f) => (
                            <div key={f.date} className="bg-surface-container-lowest/80 rounded-lg p-1 flex flex-col items-center min-w-0">
                              <span className="font-caption text-[10px] text-on-surface-variant truncate">
                                {f.dayLabel}
                              </span>
                              <span className="material-symbols-outlined text-[15px] text-amber-500 my-0.5">
                                {f.icon}
                              </span>
                              <span className="font-badge text-[11px] text-on-surface font-bold">
                                {f.highC}°
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>

                {/* Add to Trip Picker & Action */}
                <div className="bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-2">
                  {trips.length === 0 ? (
                    <div className="text-center py-2">
                      <p className="text-xs text-on-surface-variant mb-1.5">
                        You have no trips planned yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('trips')}
                        className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                      >
                        Create your first trip in Trips
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="font-caption text-[10px] text-on-surface-variant uppercase font-bold pl-1 block mb-1">
                          Select Trip
                        </label>
                        <select
                          value={targetTripId}
                          onChange={(e) => {
                            setTargetTripId(e.target.value);
                            setAddError(null);
                          }}
                          className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded-lg font-body-medium text-small text-on-surface focus:outline-none shadow-xs cursor-pointer border border-surface-container-high/50"
                        >
                          {trips.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {addError && (
                        <div className="p-2 rounded-lg bg-error/10 text-error text-xs flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">error</span>
                          <span>{addError}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleConfirmAdd()}
                        disabled={isAdding}
                        className="w-full h-10 bg-secondary hover:bg-secondary-container disabled:opacity-50 text-on-secondary font-button text-button rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors mt-0.5 cursor-pointer font-semibold"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showAddSuccess ? 'check_circle' : 'bookmark_add'}
                        </span>
                        <span>
                          {showAddSuccess
                            ? 'Added to Trip!'
                            : isAdding
                            ? 'Adding...'
                            : 'Confirm & Add to Trip'}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Third-Party Data Disclaimer */}
          <div className="p-space-md bg-surface-container-low rounded-xl flex items-start gap-3 border border-surface-container-high/40">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">info</span>
            <div className="flex flex-col">
              <span className="font-body-medium text-small text-on-surface font-semibold">
                Third-party data disclaimer
              </span>
              <p className="font-caption text-caption text-on-surface-variant mt-0.5 leading-relaxed">
                Map geometry and point-of-interest data are provided by OpenStreetMap contributors via Nominatim.
                Meteorological data is provided by Open-Meteo. Third-party data is provided for planning purposes only and may be inaccurate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Interactive Map Modal */}
      <FullscreenMapModal
        isOpen={isFullscreenMapOpen}
        onClose={() => setIsFullscreenMapOpen(false)}
        places={places}
        selectedPlaceId={selectedPlaceId}
        onSelectPlaceId={setSelectedPlaceId}
        searchQuery={searchInput}
        onSearch={handleSearch}
        isSearching={isSearching}
        selectedCategory={selectedCategory}
        onChangeCategory={setSelectedCategory}
        targetTripId={targetTripId}
        onChangeTargetTripId={setTargetTripId}
        onConfirmAddToTrip={handleConfirmAdd}
        showAddSuccess={showAddSuccess}
        addError={addError}
        weatherData={weatherData}
        weatherLoading={isWeatherLoading}
      />
    </div>
  );
};
