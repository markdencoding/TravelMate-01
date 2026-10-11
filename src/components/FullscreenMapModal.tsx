'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTravelStore } from '../store';
import { PlaceItem } from '@/lib/validators/places';
import { TrimmedWeatherResponse } from '@/lib/validators/weather';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-2 text-slate-400">
      <span className="material-symbols-outlined text-[36px] animate-spin text-primary">progress_activity</span>
      <span className="text-xs font-semibold">Loading fullscreen map...</span>
    </div>
  ),
});

export interface FullscreenMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: PlaceItem[];
  selectedPlaceId: string;
  onSelectPlaceId: (id: string) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  isSearching: boolean;
  selectedCategory: string;
  onChangeCategory: (category: string) => void;
  targetTripId: string;
  onChangeTargetTripId: (tripId: string) => void;
  onConfirmAddToTrip: (place?: PlaceItem | null) => Promise<void>;
  showAddSuccess: boolean;
  addError?: string | null;
  weatherData: TrimmedWeatherResponse | null;
  weatherLoading: boolean;
}

export const FullscreenMapModal: React.FC<FullscreenMapModalProps> = ({
  isOpen,
  onClose,
  places,
  selectedPlaceId,
  onSelectPlaceId,
  searchQuery,
  onSearch,
  isSearching,
  selectedCategory,
  onChangeCategory,
  targetTripId,
  onChangeTargetTripId,
  onConfirmAddToTrip,
  showAddSuccess,
  addError,
  weatherData,
  weatherLoading,
}) => {
  const { trips } = useTravelStore();

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState<'list' | 'detail'>('list');
  const [localSearchInput, setLocalSearchInput] = useState(searchQuery);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearchInput(searchQuery);
  }, [searchQuery]);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) || null;

  // Auto-switch to detail tab when a place is selected
  const handleSelectPlace = (place: PlaceItem) => {
    onSelectPlaceId(place.id);
    setDrawerTab('detail');
    if (!isDrawerOpen) {
      setIsDrawerOpen(true);
    }
  };

  // Filtered places
  const filteredPlaces = places.filter((p) => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  // Keyboard shortcut handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'd' || e.key === 'D') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
          setIsDrawerOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle native browser fullscreen request
  const toggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsNativeFullscreen(true);
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsNativeFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsNativeFullscreen(false);
        }
      }
    } catch {
      setIsNativeFullscreen(!isNativeFullscreen);
    }
  };

  // Track fullscreenchange event
  useEffect(() => {
    const handleFsChange = () => {
      setIsNativeFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200 select-none"
    >
      {/* Top Floating Glass App Bar */}
      <header className="relative z-40 px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-3 shadow-lg shrink-0">
        {/* Left: Exit & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-xs font-semibold shadow-xs cursor-pointer border border-slate-700/60"
            title="Exit Fullscreen [Esc]"
          >
            <span className="material-symbols-outlined text-[18px]">close_fullscreen</span>
            <span className="hidden sm:inline">Exit Fullscreen</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate font-display">
                TravelMate Expedition Map
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                Real OpenStreetMap Explorer • {filteredPlaces.length} Results
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Native Browser Fullscreen Toggle */}
          <button
            onClick={toggleBrowserFullscreen}
            type="button"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
            title={isNativeFullscreen ? 'Exit Native Fullscreen' : 'Enter Native Fullscreen'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isNativeFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
          </button>

          {/* Drawer Toggle Button */}
          <button
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isDrawerOpen
                ? 'bg-primary text-white border-primary-container'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDrawerOpen ? 'menu_open' : 'view_sidebar'}
            </span>
            <span>{isDrawerOpen ? 'Hide Drawer' : `Places (${filteredPlaces.length})`}</span>
          </button>
        </div>
      </header>

      {/* Main Fullscreen Body: Leaflet Map Canvas & Floating Collapsible Overlay Drawer */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Real Leaflet Map */}
        <LeafletMap
          places={filteredPlaces}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={handleSelectPlace}
          onMapClick={() => onSelectPlaceId('')}
          className="w-full h-full"
        />

        {/* Floating Collapsible Overlay Drawer on the Map */}
        {isDrawerOpen && (
          <aside
            aria-label="Interactive spots drawer"
            className="no-drag absolute inset-x-0 bottom-0 top-auto md:top-4 md:bottom-4 md:left-4 md:right-auto md:inset-x-auto w-full md:w-[380px] lg:w-[420px] max-h-[82vh] md:max-h-none z-30 flex flex-col bg-slate-900/95 backdrop-blur-xl rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-slate-800 overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-left-4 duration-200"
          >
            {/* Mobile Drag Indicator */}
            <div className="md:hidden pt-2.5 pb-1 flex justify-center shrink-0 bg-slate-950/60">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Drawer Header: Search & Navigation Tabs */}
            <div className="p-3.5 border-b border-slate-800 flex flex-col gap-2.5 shrink-0 bg-slate-950/60">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
                  <button
                    onClick={() => setDrawerTab('list')}
                    type="button"
                    className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                      drawerTab === 'list'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">format_list_bulleted</span>
                    <span>Places ({filteredPlaces.length})</span>
                  </button>
                  <button
                    onClick={() => setDrawerTab('detail')}
                    type="button"
                    className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                      drawerTab === 'detail'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">info</span>
                    <span>Inspector</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  type="button"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Collapse Drawer [D]"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
              </div>

              {/* Search Form inside drawer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (localSearchInput.trim()) {
                    onSearch(localSearchInput);
                  }
                }}
                className="relative w-full"
              >
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={localSearchInput}
                  onChange={(e) => setLocalSearchInput(e.target.value)}
                  placeholder="Search city, landmark..."
                  className="w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-9 pr-16 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg bg-primary text-white text-[10px] font-semibold cursor-pointer hover:bg-primary-container"
                >
                  {isSearching ? '...' : 'Go'}
                </button>
              </form>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => onChangeCategory('all')}
                  type="button"
                  className={`h-6 px-2.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => onChangeCategory('attractions')}
                  type="button"
                  className={`h-6 px-2.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'attractions'
                      ? 'bg-[#6D28D9] text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Attractions
                </button>
                <button
                  onClick={() => onChangeCategory('food')}
                  type="button"
                  className={`h-6 px-2.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'food'
                      ? 'bg-[#B45309] text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Dining
                </button>
                <button
                  onClick={() => onChangeCategory('nature')}
                  type="button"
                  className={`h-6 px-2.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'nature'
                      ? 'bg-[#047857] text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Nature
                </button>
                <button
                  onClick={() => onChangeCategory('culture')}
                  type="button"
                  className={`h-6 px-2.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'culture'
                      ? 'bg-[#005454] text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Culture
                </button>
              </div>
            </div>

            {/* Drawer Body Tab 1: Scrollable Spots List */}
            {drawerTab === 'list' && (
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {filteredPlaces.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[32px] text-slate-500">search_off</span>
                    <span className="text-xs font-semibold">No places available</span>
                    <span className="text-[11px] text-slate-400">Search for a destination above to see real places.</span>
                  </div>
                ) : (
                  filteredPlaces.map((place, idx) => {
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
                        onClick={() => handleSelectPlace(place)}
                        className={`p-2.5 rounded-xl transition-all cursor-pointer border flex gap-3 relative ${
                          isSelected
                            ? 'bg-slate-800/95 border-primary ring-1 ring-primary/40 shadow-md'
                            : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60'
                        }`}
                      >
                        {/* Icon Avatar */}
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-white font-bold ${
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
                          <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                        </div>

                        {/* Text info */}
                        <div className="flex flex-col justify-between min-w-0 flex-1">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                                {place.categoryLabel}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                #{String(idx + 1).padStart(2, '0')}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-white truncate font-display">
                              {place.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {place.country ? `${place.country} • ` : ''}
                              {place.displayName.split(',').slice(1, 3).join(',')}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-primary">pin_drop</span>
                              <span>Map Pin</span>
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPlace(place);
                              }}
                              type="button"
                              className="px-2 py-0.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Drawer Body Tab 2: Selected Spot Inspector */}
            {drawerTab === 'detail' && (
              <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3">
                {!selectedPlace ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[32px]">touch_app</span>
                    <span className="text-xs font-semibold">Select a place from the list or map</span>
                  </div>
                ) : (
                  <>
                    {/* Spot Header Card */}
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                        {selectedPlace.categoryLabel}
                      </span>
                      <h3 className="text-sm font-bold text-white font-display">
                        {selectedPlace.name}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedPlace.displayName}
                      </p>
                    </div>

                    {/* Live Open-Meteo Weather Card */}
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Live Forecast (Open-Meteo)
                        </span>
                        <span className="text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                          Live Radar
                        </span>
                      </div>

                      {weatherLoading ? (
                        <div className="flex items-center gap-2 py-2 text-xs text-slate-400 animate-pulse">
                          <span className="material-symbols-outlined text-primary text-[18px] animate-spin">
                            progress_activity
                          </span>
                          <span>Fetching forecast...</span>
                        </div>
                      ) : weatherData ? (
                        <>
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-amber-400 text-[26px]">
                              {weatherData.icon}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-white block">
                                {weatherData.currentTempC}°C • {weatherData.condition}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Humidity: {weatherData.humidity}% • Wind: {weatherData.windKmh} km/h
                              </span>
                            </div>
                          </div>

                          {/* 5-Day Strip */}
                          {weatherData.forecast && weatherData.forecast.length > 0 && (
                            <div className="grid grid-cols-5 gap-1 pt-1 text-center border-t border-slate-700/60">
                              {weatherData.forecast.slice(0, 5).map((f) => (
                                <div key={f.date} className="p-1 rounded bg-slate-900/40">
                                  <span className="text-[9px] text-slate-400 block">{f.dayLabel}</span>
                                  <span className="text-xs font-bold text-amber-400">{f.highC}°</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-slate-400 py-1">Weather unavailable for this location.</div>
                      )}
                    </div>

                    {/* Add to Trip Section */}
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col gap-2 mt-auto">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Add to Trip Itinerary
                      </span>

                      {trips.length === 0 ? (
                        <p className="text-xs text-slate-400">
                          No trips found. Create a trip first in the Trips tab.
                        </p>
                      ) : (
                        <>
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-0.5">Select Trip</label>
                            <select
                              value={targetTripId}
                              onChange={(e) => onChangeTargetTripId(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                            >
                              {trips.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          {addError && (
                            <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px]">error</span>
                              <span>{addError}</span>
                            </div>
                          )}

                          <button
                            onClick={() => onConfirmAddToTrip(selectedPlace)}
                            type="button"
                            className="w-full py-2 px-3 rounded-xl bg-secondary hover:bg-secondary-container text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer mt-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {showAddSuccess ? 'check_circle' : 'bookmark_add'}
                            </span>
                            <span>
                              {showAddSuccess ? 'Added to Trip!' : 'Confirm & Add to Trip'}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </aside>
        )}

        {/* Collapsed Drawer Floating Trigger Pill */}
        {!isDrawerOpen && (
          <button
            onClick={() => setIsDrawerOpen(true)}
            type="button"
            className="no-drag absolute top-4 left-4 z-30 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700 text-white shadow-2xl hover:bg-slate-800 transition-all cursor-pointer group"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">
              location_on
            </span>
            <span className="text-xs font-bold font-display">
              Places ({filteredPlaces.length})
            </span>
            <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
              chevron_right
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
