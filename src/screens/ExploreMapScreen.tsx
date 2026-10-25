'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useTravelStore } from '../store';
import { Trip, TripStatus, ActivityCategory, ScheduledActivity } from '@/types';
import { PlaceItem } from '@/lib/validators/places';
import { TrimmedWeatherResponse } from '@/lib/validators/weather';
import { fetchRealWeather } from '@/services/weatherApi';
import { addDestinationAction } from '@/app/actions/destinations';
import { getDestinationsForTripAction } from '@/app/actions/trips';
import { calculateTripStatus } from '@/lib/trip-status';
import { resolveTripDestinations } from '@/lib/destinations-helper';
import { FullscreenMapModal } from '../components/FullscreenMapModal';
import { PlaceSearchInput } from '@/components/PlaceSearchInput';
import { AddActivityModal } from '@/components/AddActivityModal';
import type { PlaceSuggestion } from '@/lib/validators/suggestions';
import type { NearbySpotItem } from '@/lib/validators/nearby';
import type { TripMapDestination, TripMapExtraSpot } from '@/components/map/TripMap';

// Dynamically load client-only Leaflet TripMap to prevent SSR window reference errors
const TripMap = dynamic(() => import('@/components/map/TripMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-container flex flex-col items-center justify-center gap-2 text-on-surface-variant">
      <span className="material-symbols-outlined text-[36px] animate-spin text-primary">progress_activity</span>
      <span className="text-xs font-semibold">Loading interactive map...</span>
    </div>
  ),
});

export type TripStatusFilter = 'all' | TripStatus;

const TRIP_STATUS_CHIPS: { id: TripStatusFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'All Trips', icon: 'grid_view' },
  { id: 'planned', label: 'Planned', icon: 'event_available' },
  { id: 'ongoing', label: 'Ongoing', icon: 'flight_takeoff' },
  { id: 'completed', label: 'Completed', icon: 'task_alt' },
];

function mapGeoapifyToActivityCategory(cat?: string): ActivityCategory {
  if (!cat) return 'sightseeing';
  const c = cat.toLowerCase();
  if (c.includes('food') || c.includes('restaurant') || c.includes('catering') || c.includes('cafe')) return 'food';
  if (c.includes('museum') || c.includes('heritage') || c.includes('historic') || c.includes('religion') || c.includes('temple')) return 'culture';
  if (c.includes('park') || c.includes('nature') || c.includes('beach') || c.includes('forest')) return 'nature';
  if (c.includes('sport') || c.includes('entertainment') || c.includes('leisure')) return 'leisure';
  return 'sightseeing';
}

export const ExploreMapScreen: React.FC = () => {
  const router = useRouter();
  const { trips, activeTripId, setActiveTab } = useTravelStore();

  // Search State
  const [searchInput, setSearchInput] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Search Place Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'name'>('relevance');

  // Weather State for searched place
  const [weatherData, setWeatherData] = useState<TrimmedWeatherResponse | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Add searched place to trip state
  const [targetTripId, setTargetTripId] = useState<string>(activeTripId || (trips[0]?.id ?? ''));
  const [isAdding, setIsAdding] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Fullscreen Modal State
  const [isFullscreenMapOpen, setIsFullscreenMapOpen] = useState(false);

  // Trip Category and Trip Selection State
  const [tripCategoryFilter, setTripCategoryFilter] = useState<TripStatusFilter>('all');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedTripDestinations, setSelectedTripDestinations] = useState<TripMapDestination[]>([]);
  const [activeDestIndex, setActiveDestIndex] = useState<number>(0);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);

  // Left Column active view when both trip and search exist ('trip' | 'search')
  const [leftPanelView, setLeftPanelView] = useState<'trip' | 'search'>('trip');

  // Nearby Tourist Spots State (Geoapify Places API)
  const [nearbySpots, setNearbySpots] = useState<NearbySpotItem[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [selectedNearbySpotId, setSelectedNearbySpotId] = useState<string | null>(null);

  // Add to Itinerary Modal State
  const [activityModalSpot, setActivityModalSpot] = useState<NearbySpotItem | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Trip Object
  const selectedTrip = useMemo(() => {
    if (!selectedTripId) return null;
    return trips.find((t) => t.id === selectedTripId) || null;
  }, [trips, selectedTripId]);

  // Trips categorized by status helper
  const tripsWithStatus = useMemo(() => {
    return trips.map((t) => ({
      ...t,
      computedStatus: calculateTripStatus(t.startDate, t.endDate),
    }));
  }, [trips]);

  // Counts for status chips
  const tripsByStatusCount = useMemo(() => {
    const counts: Record<string, number> = { all: trips.length };
    TRIP_STATUS_CHIPS.forEach((chip) => {
      if (chip.id !== 'all') {
        counts[chip.id] = tripsWithStatus.filter((t) => t.computedStatus === chip.id).length;
      }
    });
    return counts;
  }, [trips, tripsWithStatus]);

  // Trips matching chosen status category chip
  const matchingTrips = useMemo(() => {
    if (tripCategoryFilter === 'all') return tripsWithStatus;
    return tripsWithStatus.filter((t) => t.computedStatus === tripCategoryFilter);
  }, [tripsWithStatus, tripCategoryFilter]);

  // Auto-sync targetTripId if trips list changes
  useEffect(() => {
    if (!targetTripId && trips.length > 0) {
      setTargetTripId(trips[0].id);
    }
  }, [trips, targetTripId]);

  // Sync destinations for selected trip
  useEffect(() => {
    if (!selectedTrip) {
      setSelectedTripDestinations([]);
      setActiveDestIndex(0);
      setSelectedDestinationId(null);
      setNearbySpots([]);
      return;
    }

    if (selectedTrip.destinationsData && selectedTrip.destinationsData.length > 0) {
      const resolved = resolveTripDestinations(selectedTrip);
      setSelectedTripDestinations(resolved);
      setActiveDestIndex(0);
      setSelectedDestinationId(resolved[0]?.id || resolved[0]?.name || null);
      return;
    }

    let isMounted = true;
    getDestinationsForTripAction(selectedTrip.id).then((res) => {
      if (!isMounted) return;
      if (res.success && res.data && res.data.length > 0) {
        const resolved: TripMapDestination[] = res.data.map((d: any, idx: number) => ({
          id: d.id,
          name: d.name,
          country: d.country || selectedTrip.country || '',
          latitude: d.latitude,
          longitude: d.longitude,
          orderIndex: d.orderIndex ?? idx,
          tripId: selectedTrip.id,
          tripTitle: selectedTrip.title,
          tripStatus: selectedTrip.status,
        }));
        setSelectedTripDestinations(resolved);
        setActiveDestIndex(0);
        setSelectedDestinationId(resolved[0]?.id || resolved[0]?.name || null);
      } else {
        const fallback = resolveTripDestinations(selectedTrip);
        setSelectedTripDestinations(fallback);
        setActiveDestIndex(0);
        setSelectedDestinationId(fallback[0]?.id || fallback[0]?.name || null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedTrip]);

  // Active destination within the selected trip
  const activeDestination = useMemo(() => {
    if (selectedTripDestinations.length === 0) return null;
    return selectedTripDestinations[activeDestIndex] || selectedTripDestinations[0] || null;
  }, [selectedTripDestinations, activeDestIndex]);

  // Fetch Nearby Tourist Spots (Geoapify Places API)
  useEffect(() => {
    if (!selectedTrip || !activeDestination || typeof activeDestination.latitude !== 'number' || typeof activeDestination.longitude !== 'number') {
      setNearbySpots([]);
      setIsNearbyLoading(false);
      setNearbyError(null);
      return;
    }

    // Coordinates check
    if (activeDestination.latitude === 0 && activeDestination.longitude === 0) {
      setNearbySpots([]);
      setIsNearbyLoading(false);
      return;
    }

    let isMounted = true;
    setIsNearbyLoading(true);
    setNearbyError(null);

    const queryUrl = `/api/places/nearby?lat=${activeDestination.latitude}&lon=${activeDestination.longitude}&radius=10000&tripId=${encodeURIComponent(selectedTrip.id)}`;

    fetch(queryUrl)
      .then(async (res) => {
        const data = await res.json();
        if (!isMounted) return;

        if (!res.ok) {
          // If key is missing or quota reached, hide section quietly per spec
          if (data.code === 'key_missing' || data.code === 'quota_exceeded') {
            setNearbySpots([]);
            setNearbyError(null);
          } else {
            setNearbyError(data.error || 'Failed to load tourist attractions.');
            setNearbySpots([]);
          }
          return;
        }

        const spots: NearbySpotItem[] = data.places || data.spots || [];
        setNearbySpots(spots);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Nearby places request failed:', err);
        setNearbySpots([]);
      })
      .finally(() => {
        if (isMounted) setIsNearbyLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTrip?.id, activeDestination?.latitude, activeDestination?.longitude]);

  // Selected place object for search results
  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) || null,
    [places, selectedPlaceId]
  );

  // Load weather when selected searched place changes
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

  // Keyboard shortcut: Press 'F' for fullscreen map, Escape to dismiss
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'Escape') {
        setSelectedPlaceId('');
        setSelectedNearbySpotId(null);
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
        setLeftPanelView('search');

        if (returnedPlaces.length > 0) {
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
      setLeftPanelView('search');

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
    if (selectedTrip) {
      setLeftPanelView('trip');
    }
  };

  const handleSelectTrip = (trip: Trip | null) => {
    if (!trip) {
      setSelectedTripId(null);
      setSelectedTripDestinations([]);
      setSelectedDestinationId(null);
      setNearbySpots([]);
      setSelectedNearbySpotId(null);
      if (hasSearched) setLeftPanelView('search');
      return;
    }

    setSelectedTripId(trip.id);
    setTargetTripId(trip.id);
    setLeftPanelView('trip');
  };

  const handleOpenAddActivityModal = (spot: NearbySpotItem) => {
    setActivityModalSpot(spot);
    setIsActivityModalOpen(true);
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered & Sorted Search Places
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

  // Convert NearbySpots to TripMapExtraSpot
  const mapExtraSpots: TripMapExtraSpot[] = useMemo(() => {
    return nearbySpots.map((s) => ({
      id: s.id,
      name: s.name,
      categoryLabel: s.categoryLabel,
      category: s.category,
      distanceMeters: s.distanceMeters,
      latitude: s.latitude,
      longitude: s.longitude,
    }));
  }, [nearbySpots]);

  return (
    <div className="w-full flex flex-col gap-space-md">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[18px] text-teal-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Context & Action Area */}
      <div className="px-0 sm:px-space-lg pt-1 sm:pt-space-md pb-space-sm bg-surface">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs font-caption text-caption text-on-surface-variant mb-space-xs">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              router.push('/dashboard');
            }}
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
              Search real destinations worldwide, inspect live Open-Meteo forecasts, and pick any expedition to inspect its route and recommended nearby spots.
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

        {/* TRIP CATEGORIES & EXPEDITION SELECTOR ROW */}
        <div className="pt-space-xs pb-space-sm border-t border-surface-container-high/40 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 py-0.5">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">filter_list</span>
                <span>Trip Status:</span>
              </span>

              {TRIP_STATUS_CHIPS.map((chip) => {
                const isSelected = tripCategoryFilter === chip.id;
                const count = tripsByStatusCount[chip.id] ?? 0;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setTripCategoryFilter(chip.id)}
                    className={`h-7 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-primary text-white shadow-xs font-bold'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-surface-container-high/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{chip.icon}</span>
                    <span>{chip.label}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedTrip && (
              <button
                type="button"
                onClick={() => handleSelectTrip(null)}
                className="h-7 px-2.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-error bg-surface-container-lowest hover:bg-error/10 border border-surface-container-high/50 flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                title="Deselect trip and return to search only view"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                <span>Clear Trip Selection</span>
              </button>
            )}
          </div>

          {/* Trip Selection Chips / List */}
          <div className="flex flex-wrap items-center gap-2 py-1">
            {matchingTrips.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-surface-container-high/40">
                <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                <span>
                  {trips.length === 0
                    ? 'No trips created yet.'
                    : `No ${tripCategoryFilter} trips found.`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('trips');
                    router.push('/trips');
                  }}
                  className="text-primary font-bold hover:underline cursor-pointer ml-1"
                >
                  Create or view expeditions &rarr;
                </button>
              </div>
            ) : (
              <>
                <span className="text-xs font-medium text-on-surface-variant shrink-0 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">explore</span>
                  <span>Select Trip:</span>
                </span>
                {matchingTrips.map((t) => {
                  const isSelected = selectedTrip?.id === t.id;
                  const ptsCount = (t.destinationsData?.length ?? t.destinations?.length) || 1;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTrip(isSelected ? null : t)}
                      className={`h-7 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-secondary text-on-secondary shadow-xs font-bold ring-2 ring-secondary/30'
                          : 'bg-surface-container-lowest text-on-surface hover:border-primary/50 border border-surface-container-high/60'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isSelected ? 'check_circle' : 'flight'}
                      </span>
                      <span className="max-w-[150px] truncate">{t.title}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded-md font-mono ${
                        isSelected ? 'bg-black/15 text-white' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {ptsCount} pts
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Category Filter Chips for search places */}
        {hasSearched && places.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-space-sm pt-space-xs">
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
      <div className="px-0 sm:px-space-lg pb-space-lg flex flex-col md:flex-row gap-4 sm:gap-space-md lg:gap-space-lg items-start">
        {/* Left Column: Trip Highlights & Nearby Spots OR Search Results */}
        <div className="w-full md:w-[360px] lg:w-[450px] shrink-0 flex flex-col gap-space-md">
          {/* Subview Toggle if BOTH Trip and Search Results are active */}
          {selectedTrip && hasSearched && places.length > 0 && (
            <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl border border-surface-container-high/60">
              <button
                type="button"
                onClick={() => setLeftPanelView('trip')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  leftPanelView === 'trip'
                    ? 'bg-surface text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">explore</span>
                <span className="truncate">Trip Highlights ({nearbySpots.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setLeftPanelView('search')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  leftPanelView === 'search'
                    ? 'bg-surface text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-primary">search</span>
                <span className="truncate">Search Results ({filteredPlaces.length})</span>
              </button>
            </div>
          )}

          {/* VIEW A: SELECTED TRIP & NEARBY TOURIST SPOTS PANEL */}
          {selectedTrip && leftPanelView === 'trip' && (
            <div className="flex flex-col gap-space-md animate-in fade-in duration-200">
              {/* Trip Header Card */}
              <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/60 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-secondary/15 text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {calculateTripStatus(selectedTrip.startDate, selectedTrip.endDate)}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {selectedTrip.startDate} &rarr; {selectedTrip.endDate}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-on-surface truncate font-display">
                      {selectedTrip.title}
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                      {selectedTrip.destinationRegion || selectedTrip.country} • {selectedTripDestinations.length} destination waypoints
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectTrip(null)}
                    className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors cursor-pointer"
                    title="Clear trip selection"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                {/* Destination Waypoint Tabs (grouped by destination) */}
                {selectedTripDestinations.length > 0 ? (
                  <div className="mt-3 pt-3 border-t border-surface-container-high/40">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                      Select Destination ({selectedTripDestinations.length}):
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 pb-1">
                      {selectedTripDestinations.map((dest, idx) => {
                        const isDestActive = idx === activeDestIndex;
                        return (
                          <button
                            key={dest.id || `${dest.name}-${idx}`}
                            type="button"
                            onClick={() => {
                              setActiveDestIndex(idx);
                              setSelectedDestinationId(dest.id || dest.name);
                              setSelectedNearbySpotId(null);
                            }}
                            className={`h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                              isDestActive
                                ? 'bg-primary text-white shadow-xs font-bold'
                                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            <span className="font-mono text-[10px]">#{idx + 1}</span>
                            <span className="max-w-[110px] truncate">{dest.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-3 rounded-xl bg-surface-container text-center text-xs text-on-surface-variant">
                    No destinations mapped for this trip yet.
                  </div>
                )}
              </div>

              {/* NEARBY TOURIST SPOTS SECTION (Geoapify Places API) */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-purple-600 dark:text-purple-400">
                      attractions
                    </span>
                    <h3 className="text-sm font-bold text-on-surface">
                      Nearby Tourist Spots
                    </h3>
                  </div>
                  {activeDestination && (
                    <span className="text-[11px] font-medium text-on-surface-variant">
                      within 10 km of <span className="font-semibold text-primary">{activeDestination.name}</span>
                    </span>
                  )}
                </div>

                {/* 1. Loading Skeleton */}
                {isNearbyLoading && (
                  <div className="flex flex-col gap-2.5">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-high/40 animate-pulse flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="h-4 bg-surface-container rounded w-1/2" />
                          <div className="h-3 bg-surface-container rounded w-1/4" />
                        </div>
                        <div className="h-3 bg-surface-container rounded w-3/4" />
                        <div className="h-6 bg-surface-container rounded w-1/3 mt-1" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Quiet Error State */}
                {!isNearbyLoading && nearbyError && (
                  <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high/50 text-center text-xs text-on-surface-variant flex flex-col items-center gap-1.5">
                    <span className="material-symbols-outlined text-[20px] text-amber-500">info</span>
                    <span>Tourist spots are temporarily unavailable for this area.</span>
                  </div>
                )}

                {/* 3. Empty State */}
                {!isNearbyLoading && !nearbyError && nearbySpots.length === 0 && (
                  <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high/60 text-center flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[28px] text-on-surface-variant opacity-60">
                      near_me_disabled
                    </span>
                    <span className="text-xs font-semibold text-on-surface">
                      No tourist spots found nearby
                    </span>
                    <p className="text-[11px] text-on-surface-variant max-w-xs">
                      Try selecting another waypoint above, or search for custom attractions using the search bar.
                    </p>
                  </div>
                )}

                {/* 4. Loaded Nearby Spots List */}
                {!isNearbyLoading && nearbySpots.length > 0 && (
                  <div className="flex flex-col gap-2.5 max-h-[580px] overflow-y-auto pr-1">
                    {nearbySpots.map((spot) => {
                      const isHighlighted = spot.id === selectedNearbySpotId;
                      const distanceKm = (spot.distanceMeters / 1000).toFixed(1);

                      return (
                        <div
                          key={spot.id}
                          onClick={() => setSelectedNearbySpotId(spot.id)}
                          className={`bg-surface-container-lowest rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col gap-2 ${
                            isHighlighted
                              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md bg-purple-500/5'
                              : 'border-surface-container-high/60 hover:border-purple-400/50 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                  {spot.categoryLabel}
                                </span>
                                <span className="text-[11px] text-on-surface-variant font-mono">
                                  {distanceKm} km away
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-on-surface truncate">
                                {spot.name}
                              </h4>
                              {spot.address && (
                                <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                                  {spot.address}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddActivityModal(spot);
                              }}
                              className="h-7 px-2.5 bg-secondary hover:bg-secondary-container text-on-secondary rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer shrink-0"
                              title="Add to Itinerary"
                            >
                              <span className="material-symbols-outlined text-[15px]">event_available</span>
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Attribution per Geoapify usage guidelines */}
                    <div className="pt-2 text-center text-[10px] text-on-surface-variant opacity-75">
                      Powered by <a href="https://www.geoapify.com" target="_blank" rel="noreferrer" className="underline hover:text-primary">Geoapify</a> • OpenStreetMap contributors
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW B: SEARCH RESULTS LIST / EMPTY STATE */}
          {(!selectedTrip || leftPanelView === 'search') && (
            <>
              {/* Subheader when search results exist */}
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

              {/* 1. INITIAL EMPTY STATE (Before search & no trip selected) */}
              {!hasSearched && !isSearching && !selectedTrip && (
                <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-surface-container-high/60 shadow-xs flex flex-col items-center text-center gap-space-sm py-12">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1">
                    <span className="material-symbols-outlined text-[36px]">travel_explore</span>
                  </div>
                  <h3 className="font-section-title text-section-title text-on-surface font-bold">
                    Search for a destination or pick a trip
                  </h3>
                  <p className="font-body text-body text-on-surface-variant max-w-sm text-balance">
                    Select one of your trips above to inspect its waypoints and tourist spots, or enter a city above to search real destinations.
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

              {/* 3. SEARCH ERROR STATE */}
              {!isSearching && searchError && (
                <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-error/30 shadow-xs flex flex-col items-center text-center gap-space-sm py-10">
                  <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">warning</span>
                  </div>
                  <h3 className="font-section-title text-section-title text-on-surface font-bold">
                    Search Error
                  </h3>
                  <p className="font-body text-body text-on-surface-variant max-w-xs">{searchError}</p>
                  <button
                    onClick={() => handleSearch(submittedQuery)}
                    className="mt-2 px-4 py-2 bg-primary text-on-primary font-button text-button rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
                    type="button"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* 4. NO SEARCH RESULTS */}
              {!isSearching && !searchError && hasSearched && places.length === 0 && (
                <div className="bg-surface-container-lowest rounded-2xl p-space-lg border border-surface-container-high/60 shadow-xs flex flex-col items-center text-center gap-space-sm py-10">
                  <div className="w-12 h-12 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-[28px]">location_off</span>
                  </div>
                  <h3 className="font-section-title text-section-title text-on-surface font-bold">
                    No matching places found
                  </h3>
                  <p className="font-body text-body text-on-surface-variant max-w-xs text-balance">
                    We could not find any locations matching "{submittedQuery}". Try refining your search query or check the spelling.
                  </p>
                  <button
                    onClick={handleClearSearch}
                    className="mt-2 px-4 py-2 border border-surface-container-high/80 text-on-surface font-button text-button rounded-xl hover:bg-surface-container transition-colors cursor-pointer"
                    type="button"
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {/* 5. SEARCH RESULTS LIST */}
              {!isSearching && places.length > 0 && (
                <div className="flex flex-col gap-space-sm max-h-[620px] overflow-y-auto pr-1">
                  {filteredPlaces.map((place, index) => {
                    const isSelected = place.id === selectedPlaceId;
                    return (
                      <div
                        key={place.id}
                        onClick={() => setSelectedPlaceId(place.id)}
                        className={`bg-surface-container-lowest rounded-2xl p-space-md border transition-all cursor-pointer flex flex-col gap-space-xs relative overflow-hidden ${
                          isSelected
                            ? 'border-secondary ring-2 ring-secondary/20 shadow-md bg-secondary/5'
                            : 'border-surface-container-high/60 hover:border-primary/50 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-space-md">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected
                                ? 'bg-secondary text-white'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            #{String(index + 1).padStart(2, '0')}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="bg-surface-container-high text-primary font-badge text-badge px-2 py-0.5 rounded-full font-bold uppercase truncate">
                                {place.categoryLabel}
                              </span>
                            </div>
                            <h3 className="font-item-title text-item-title text-on-surface font-semibold truncate">
                              {place.name}
                            </h3>
                            <p className="font-caption text-caption text-on-surface-variant line-clamp-1 mt-0.5">
                              {place.country ? `${place.country} • ` : ''}
                              {place.displayName.split(',').slice(1, 3).join(',').trim()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-surface-container-high/40">
                          {isSelected ? (
                            <span className="text-secondary font-badge text-badge uppercase flex items-center gap-1 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
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
                            <span>Add to Trip</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Shared Interactive Leaflet TripMap & Floating Overlays */}
        <div className="flex-1 w-full flex flex-col gap-space-md">
          {/* Map Container */}
          <div className="relative w-full h-[640px] rounded-2xl overflow-hidden shadow-sm bg-surface-container border border-surface-container-high/60">
            {/* Real Client-Side Leaflet TripMap */}
            <TripMap
              destinations={selectedTripDestinations}
              extraSpots={mapExtraSpots}
              searchPlaces={filteredPlaces}
              selectedDestinationId={selectedDestinationId}
              selectedExtraSpotId={selectedNearbySpotId}
              selectedSearchPlaceId={selectedPlaceId}
              onSelectDestination={(dest) => {
                setSelectedDestinationId(dest.id || dest.name);
                const idx = selectedTripDestinations.findIndex((d) => (d.id || d.name) === (dest.id || dest.name));
                if (idx >= 0) setActiveDestIndex(idx);
                setSelectedNearbySpotId(null);
                setLeftPanelView('trip');
              }}
              onSelectExtraSpot={(spot) => {
                setSelectedNearbySpotId(spot.id);
                setLeftPanelView('trip');
              }}
              onSelectSearchPlace={(p) => {
                setSelectedPlaceId(p.id);
                setLeftPanelView('search');
              }}
              onMapClick={() => {
                setSelectedPlaceId('');
                setSelectedNearbySpotId(null);
              }}
              showRouteLine={true}
              allowEmptyMap={true}
              emptyStateTitle={
                selectedTrip
                  ? 'Add a destination to see the map'
                  : 'Search destinations or pick a trip to see map'
              }
              emptyStateDescription={
                selectedTrip
                  ? 'Add waypoints to map your route, calculate distances, and inspect local tourist highlights.'
                  : 'Select an expedition above to view its route and nearby spots, or search any city.'
              }
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

            {/* Selected Searched Place Floating Drawer / Card */}
            {selectedPlace && leftPanelView === 'search' && (
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
                      onClick={() => setSelectedPlaceId('')}
                      aria-label="Close inspector"
                      className="text-on-surface-variant hover:text-on-surface min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-surface-container"
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
                        onClick={() => {
                          setActiveTab('trips');
                          router.push('/trips');
                        }}
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
                Map geometry and points of interest are sourced from OpenStreetMap contributors and Geoapify Places API.
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

      {/* Add To Itinerary Modal for Nearby Spots */}
      {activityModalSpot && selectedTrip && (
        <AddActivityModal
          isOpen={isActivityModalOpen}
          onClose={() => {
            setIsActivityModalOpen(false);
            setActivityModalSpot(null);
          }}
          initialTripId={selectedTrip.id}
          initialTitle={activityModalSpot.name}
          initialLocation={activityModalSpot.address || activityModalSpot.name}
          initialCategory={mapGeoapifyToActivityCategory(activityModalSpot.category)}
          initialDayNumber={1}
          initialStartTime="09:00 AM"
          initialEndTime="11:00 AM"
          onSuccess={(act) => {
            showToast(`Added "${act.title}" to day ${act.dayNumber} itinerary!`);
          }}
        />
      )}
    </div>
  );
};
