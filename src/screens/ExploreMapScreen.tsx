import React, { useState, useEffect } from 'react';
import { useTravelStore } from '../store';
import { PlacePOI } from '../types';
import { FullscreenMapModal } from '../components/FullscreenMapModal';

export const ExploreMapScreen: React.FC = () => {
  const {
    places,
    trips,
    activeTripId,
    addPlaceToTrip,
    toggleSavePlace,
    setActiveTab,
  } = useTravelStore();

  const [searchVal, setSearchVal] = useState('Gion District, Kyoto');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('place-2'); // Fushimi Inari active
  const [targetTripId, setTargetTripId] = useState<string>(activeTripId);
  const [targetDay, setTargetDay] = useState<number>(3);
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [mapMode, setMapMode] = useState<'default' | 'satellite' | 'elevation'>('default');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isFullscreenMapOpen, setIsFullscreenMapOpen] = useState(false);

  // Keyboard shortcut: Press 'F' to open full map
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'f' || e.key === 'F') {
        setIsFullscreenMapOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) || places[1];

  const filteredPlaces = places.filter((p) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'rated') return p.rating >= 4.8;
    return p.category === selectedCategory;
  });

  const handleConfirmAdd = () => {
    if (!selectedPlace) return;
    addPlaceToTrip(selectedPlace.id, targetTripId, targetDay);
    setShowAddSuccess(true);
    setTimeout(() => setShowAddSuccess(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-space-md">
      {/* Top Context & Action Area */}
      <div className="px-space-lg pt-space-md pb-space-sm bg-surface">
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
              Discover curated viewpoints, authentic dining, and cultural heritage to bookmark into your itineraries.
            </p>
          </div>

          {/* Autocomplete Input & Fullscreen Trigger */}
          <div className="flex items-center gap-space-sm w-full lg:w-auto">
            <div className="relative w-full lg:w-[380px] z-30">
              <div className="flex items-center bg-surface-container-lowest rounded-xl shadow-sm px-space-md py-2.5 border border-surface-container-high/60">
                <span className="material-symbols-outlined text-primary text-[20px] mr-2.5">search</span>
                <input
                  className="w-full bg-transparent font-body text-body text-on-surface focus:outline-none"
                  placeholder="Search Kyoto spots, temples, dining..."
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onFocus={() => setIsSearchDropdownOpen(true)}
                />
                {searchVal && (
                  <button
                    type="button"
                    onClick={() => setSearchVal('')}
                    aria-label="Clear search"
                    className="text-on-surface-variant hover:text-on-surface p-0.5 rounded-full cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

            {/* Autocomplete Dropdown Preview */}
            {isSearchDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden py-1.5 border border-surface-container-high z-40 animate-in fade-in duration-150">
                <div className="flex items-center justify-between px-3.5 py-1 text-[11px] font-badge tracking-wider uppercase text-on-surface-variant font-bold">
                  <span>Matching Spots</span>
                  <button
                    onClick={() => setIsSearchDropdownOpen(false)}
                    className="text-on-surface-variant hover:text-on-surface text-[10px]"
                    type="button"
                  >
                    Close
                  </button>
                </div>
                <div
                  onClick={() => {
                    setSearchVal('Gion Hanami-koji Street');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="flex items-center gap-space-sm px-3.5 py-2 hover:bg-surface-container-low cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-surface-variant flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body-medium text-small text-on-surface font-semibold">
                      Gion Hanami-koji Street
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Historic Geisha district preservation corridor
                    </span>
                  </div>
                </div>
                <div
                  onClick={() => {
                    setSearchVal('Gion Shirakawa Canal');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="flex items-center gap-space-sm px-3.5 py-2 hover:bg-surface-container-low cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-surface-variant flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[16px]">water</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body-medium text-small text-on-surface font-semibold">
                      Gion Shirakawa Canal
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Willow-lined stone bridge walkway
                    </span>
                  </div>
                </div>
                <div
                  onClick={() => {
                    setSearchVal('Kennin-ji Temple');
                    setIsSearchDropdownOpen(false);
                  }}
                  className="flex items-center gap-space-sm px-3.5 py-2 hover:bg-surface-container-low cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-surface-variant flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[16px]">temple_buddhist</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body-medium text-small text-on-surface font-semibold">
                      Kennin-ji Temple
                    </span>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Kyoto's oldest Zen sanctuary &amp; twin dragons mural
                    </span>
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* View Fullscreen Map Button */}
            <button
              onClick={() => setIsFullscreenMapOpen(true)}
              type="button"
              className="h-[42px] px-3.5 bg-primary hover:bg-primary-container text-on-primary font-button text-caption rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer whitespace-nowrap font-semibold shrink-0"
              title="Expand to Fullscreen Map [Press F]"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_full</span>
              <span>Full Map</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/20 text-white">
                F
              </kbd>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-space-sm no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`h-7 px-3.5 rounded-full font-badge text-badge flex items-center gap-1 shadow-xs whitespace-nowrap cursor-pointer font-bold ${
              selectedCategory === 'all'
                ? 'bg-primary-container text-on-primary'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>ALL PLACES</span>
          </button>
          <button
            onClick={() => setSelectedCategory('attractions')}
            className={`h-7 px-3.5 rounded-full font-badge text-badge flex items-center gap-1 whitespace-nowrap cursor-pointer font-bold ${
              selectedCategory === 'attractions'
                ? 'bg-[#6D28D9] text-white shadow-xs'
                : 'bg-[#EDE9FE] text-[#6D28D9] hover:brightness-95'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">local_activity</span>
            <span>ATTRACTIONS</span>
          </button>
          <button
            onClick={() => setSelectedCategory('food')}
            className={`h-7 px-3.5 rounded-full font-badge text-badge flex items-center gap-1 whitespace-nowrap cursor-pointer font-bold ${
              selectedCategory === 'food'
                ? 'bg-[#B45309] text-white shadow-xs'
                : 'bg-[#FEF3C7] text-[#B45309] hover:brightness-95'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">restaurant</span>
            <span>FOOD &amp; DINING</span>
          </button>
          <button
            onClick={() => setSelectedCategory('nature')}
            className={`h-7 px-3.5 rounded-full font-badge text-badge flex items-center gap-1 whitespace-nowrap cursor-pointer font-bold ${
              selectedCategory === 'nature'
                ? 'bg-[#047857] text-white shadow-xs'
                : 'bg-[#D1FAE5] text-[#047857] hover:brightness-95'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">forest</span>
            <span>NATURE</span>
          </button>
          <button
            onClick={() => setSelectedCategory('culture')}
            className={`h-7 px-3.5 rounded-full font-badge text-badge flex items-center gap-1 whitespace-nowrap cursor-pointer font-bold ${
              selectedCategory === 'culture'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-container-high text-primary hover:brightness-95'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">temple_buddhist</span>
            <span>CULTURE &amp; SHRINES</span>
          </button>
          <button
            onClick={() => setSelectedCategory('rated')}
            className={`h-7 px-3.5 rounded-full font-badge text-badge flex items-center gap-1 shadow-xs whitespace-nowrap cursor-pointer font-bold ${
              selectedCategory === 'rated'
                ? 'bg-amber-500 text-white'
                : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[14px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
            <span>HIGHLY RATED (4.8+)</span>
          </button>
        </div>
      </div>

      {/* Two-Column Split Layout: 2-column on tablet (768px-1023px) and desktop (1024px+) */}
      <div className="px-space-md md:px-space-lg pb-space-lg flex flex-col md:flex-row gap-space-md lg:gap-space-lg items-start">
        {/* Left Column: Results List (360px on tablet, 440px on desktop) */}
        <div className="w-full md:w-[340px] lg:w-[440px] shrink-0 flex flex-col gap-space-md">
          {/* Results Subheader */}
          <div className="flex items-center justify-between px-space-xs">
            <div className="flex items-center gap-2">
              <span className="font-item-title text-item-title text-on-surface font-semibold">
                Kyoto Destinations
              </span>
              <span className="font-caption text-caption px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-body-medium">
                {filteredPlaces.length} found
              </span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant font-caption text-caption cursor-pointer hover:text-on-surface">
              <span>Sort: Relevance</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </div>
          </div>

          {/* Places List Scroll Area */}
          <div className="flex flex-col gap-space-sm max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {filteredPlaces.map((place) => {
              const isSelected = selectedPlaceId === place.id;
              return (
                <div
                  key={place.id}
                  onClick={() => setSelectedPlaceId(place.id)}
                  className={`bg-surface-container-lowest rounded-xl p-space-md transition-all cursor-pointer relative overflow-hidden border ${
                    isSelected
                      ? 'shadow-md ring-2 ring-primary border-primary'
                      : 'shadow-sm hover:shadow-md border-surface-container-high/40'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full pointer-events-none" />
                  )}
                  <div className="flex gap-space-md">
                    <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 relative bg-surface-container">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={place.imageAlt}
                        src={place.image}
                      />
                      <span
                        className={`absolute top-1 left-1 font-badge text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          isSelected
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-lowest/90 backdrop-blur-sm text-primary'
                        }`}
                      >
                        {place.numberTag}
                      </span>
                    </div>

                    <div className="flex flex-col flex-1 min-w-0 justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`font-badge text-badge px-2 py-0.5 rounded-full font-bold uppercase ${
                              place.category === 'attractions'
                                ? 'bg-[#EDE9FE] text-[#6D28D9]'
                                : place.category === 'food'
                                ? 'bg-[#FEF3C7] text-[#B45309]'
                                : place.category === 'nature'
                                ? 'bg-[#D1FAE5] text-[#047857]'
                                : 'bg-surface-container-high text-primary'
                            }`}
                          >
                            {place.categoryLabel}
                          </span>
                          <div className="flex items-center gap-0.5 text-amber-600 font-caption text-caption font-bold">
                            <span
                              className="material-symbols-outlined text-[14px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              star
                            </span>
                            <span>{place.rating}</span>
                            <span className="text-on-surface-variant font-normal">
                              ({place.reviewCount})
                            </span>
                          </div>
                        </div>

                        <h3 className="font-item-title text-item-title text-on-surface truncate font-semibold">
                          {place.name}
                        </h3>
                        <p className="font-caption text-caption text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                          <span className="truncate">{place.ward}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        {isSelected ? (
                          <span className="text-secondary font-badge text-badge uppercase flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                            Viewing On Map
                          </span>
                        ) : place.isSaved ? (
                          <span className="bg-surface-container-low text-primary font-caption text-caption px-2 py-0.5 rounded-full flex items-center gap-1 font-body-medium">
                            <span className="material-symbols-outlined text-[14px]">bookmark</span>
                            <span>Saved in Kyoto Trip</span>
                          </span>
                        ) : (
                          <span className="font-caption text-caption text-on-surface-variant truncate">
                            {place.timing}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlaceId(place.id);
                            handleConfirmAdd();
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
        </div>

        {/* Right Column: Interactive Map & Selected Place Overlay */}
        <div className="flex-1 w-full flex flex-col gap-space-md">
          {/* Map Container */}
          <div className="relative w-full h-[620px] rounded-2xl overflow-hidden shadow-sm bg-surface-container border border-surface-container-high/60">
            {/* Map Canvas Background */}
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-500"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDIoPcM7w2dBQR29bkdxMOblbST_gCRKeRHiIzFxM0kX1So8zQAGVZjYi9QIQR-rMsD46ZglL7OMPxR21T5JMRSIuRi2riE1nHCnUrVeVrcGlj4NInFpVuykyCbgQ-r-FpJDvFkI9F5hcav5As4UfusSUMGwyH7JiBmB6OtC9Zh2RS-EB14l-WYV_rNEuA0Q7GoijNw3Dt5gyDQRHtMnMYzqSkuT7BWQrlgFNmZa0jqjW4ZdBjCkSzvJQ')",
                transform: `scale(${zoomLevel})`,
                filter: mapMode === 'satellite' ? 'contrast(1.1) brightness(0.9)' : undefined,
              }}
            />

            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

            {/* Top Map Controls Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center bg-surface-container-lowest/90 backdrop-blur-md rounded-lg p-1 shadow-md border border-surface-container-high/40">
                <button
                  type="button"
                  onClick={() => setMapMode('default')}
                  className={`px-3 py-1 rounded font-caption text-caption font-semibold cursor-pointer transition-colors ${
                    mapMode === 'default'
                      ? 'bg-primary-container text-on-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Default Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('satellite')}
                  className={`px-3 py-1 rounded font-caption text-caption font-semibold cursor-pointer transition-colors ${
                    mapMode === 'satellite'
                      ? 'bg-primary-container text-on-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode('elevation')}
                  className={`px-3 py-1 rounded font-caption text-caption font-semibold cursor-pointer transition-colors ${
                    mapMode === 'elevation'
                      ? 'bg-primary-container text-on-primary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Elevation
                </button>
              </div>

              {/* Zoom & Center Tools */}
              <div className="flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md rounded-lg p-1 shadow-md border border-surface-container-high/40">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
                  aria-label="Zoom in"
                  className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-container-low cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.85))}
                  aria-label="Zoom out"
                  className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-container-low cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">remove</span>
                </button>
                <div className="w-px h-4 bg-surface-container-high mx-0.5" />
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  aria-label="Center Kyoto"
                  className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-container-low cursor-pointer"
                  title="Center Kyoto"
                >
                  <span className="material-symbols-outlined text-[20px]">my_location</span>
                </button>
                <div className="w-px h-4 bg-surface-container-high mx-0.5" />
                <button
                  type="button"
                  onClick={() => setIsFullscreenMapOpen(true)}
                  aria-label="Expand map to full screen"
                  className="h-8 px-2.5 flex items-center gap-1 text-on-surface-variant hover:text-primary rounded hover:bg-surface-container-low cursor-pointer font-caption text-caption font-semibold transition-colors"
                  title="Expand to Fullscreen Map [Press F]"
                >
                  <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                  <span className="hidden sm:inline">Full Map</span>
                </button>
              </div>
            </div>

            {/* Custom Map Pins */}
            {places.map((place) => {
              const isSelected = selectedPlaceId === place.id;
              const coords = place.pinCoordinates;
              const iconName =
                place.category === 'attractions'
                  ? 'local_activity'
                  : place.category === 'food'
                  ? 'restaurant'
                  : place.category === 'nature'
                  ? 'forest'
                  : 'temple_buddhist';

              return (
                <div
                  key={place.id}
                  onClick={() => setSelectedPlaceId(place.id)}
                  style={{ top: `${coords.yPercent}%`, left: `${coords.xPercent}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-transform duration-200 ${
                    isSelected ? 'z-30 scale-110' : 'z-20 hover:scale-105'
                  }`}
                >
                  <div
                    className={`px-2 py-1 rounded-md shadow-md mb-1 text-[11px] font-semibold flex items-center gap-1 ${
                      isSelected
                        ? 'bg-primary text-on-primary ring-2 ring-surface-container-lowest'
                        : 'bg-surface-container-lowest text-on-surface opacity-90'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-ping" />}
                    <span className="font-bold">{place.numberTag}</span>
                    <span>{place.name.split(' ')[0]}</span>
                  </div>

                  <div className="relative">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${
                        isSelected
                          ? 'bg-secondary text-on-secondary ring-4 ring-secondary/30'
                          : place.category === 'culture'
                          ? 'bg-primary text-on-primary'
                          : place.category === 'food'
                          ? 'bg-[#B45309] text-white'
                          : place.category === 'nature'
                          ? 'bg-[#047857] text-white'
                          : 'bg-[#6D28D9] text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{iconName}</span>
                    </div>
                    {isSelected && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-secondary rotate-45" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Selected Place Floating Drawer / Card */}
            {selectedPlace && (
              <div className="absolute bottom-4 left-4 max-w-md w-full bg-surface-container-lowest/95 backdrop-blur-xl rounded-xl p-space-md shadow-2xl z-30 pointer-events-auto border border-surface-container-high/60 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-start justify-between gap-space-sm mb-space-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="bg-[#EDE9FE] text-[#6D28D9] font-badge text-badge px-2 py-0.5 rounded-full font-bold uppercase">
                        {selectedPlace.categoryLabel}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-600 font-caption text-caption font-bold">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span>{selectedPlace.rating}</span>
                      </div>
                    </div>
                    <h2 className="font-section-title text-section-title text-on-surface font-bold">
                      {selectedPlace.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsFullscreenMapOpen(true)}
                      aria-label="Inspect in full map"
                      title="Inspect in Full Map [Press F]"
                      className="text-on-surface-variant hover:text-primary p-1 rounded-md cursor-pointer transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_full</span>
                    </button>
                    <button
                      onClick={() => setSelectedPlaceId('')}
                      aria-label="Close inspector"
                      className="text-on-surface-variant hover:text-on-surface p-1 rounded-md cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Weather Widget */}
                <div className="bg-surface-container-low rounded-lg p-2.5 mb-space-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">wb_sunny</span>
                    <div className="flex flex-col">
                      <span className="font-body-medium text-small text-on-surface font-semibold">
                        {selectedPlace.weatherText || '16°C • Clear & Crisp'}
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant">
                        Light Breeze • Ideal for hiking
                      </span>
                    </div>
                  </div>
                  <span className="bg-surface-container-lowest text-primary font-badge text-badge px-2 py-1 rounded-md shadow-xs font-bold">
                    LIVE FORECAST
                  </span>
                </div>

                {/* 5-Day Micro Weather Strip */}
                <div className="grid grid-cols-5 gap-1.5 mb-space-sm text-center">
                  <div className="bg-surface-container-low/60 rounded-lg p-1.5 flex flex-col items-center">
                    <span className="font-caption text-[11px] text-on-surface-variant">Today</span>
                    <span className="material-symbols-outlined text-[16px] text-amber-500 my-0.5">sunny</span>
                    <span className="font-badge text-badge text-on-surface font-bold">17°</span>
                  </div>
                  <div className="bg-surface-container-low/60 rounded-lg p-1.5 flex flex-col items-center">
                    <span className="font-caption text-[11px] text-on-surface-variant">Tue</span>
                    <span className="material-symbols-outlined text-[16px] text-slate-500 my-0.5">partly_cloudy_day</span>
                    <span className="font-badge text-badge text-on-surface font-bold">15°</span>
                  </div>
                  <div className="bg-surface-container-low/60 rounded-lg p-1.5 flex flex-col items-center">
                    <span className="font-caption text-[11px] text-on-surface-variant">Wed</span>
                    <span className="material-symbols-outlined text-[16px] text-teal-600 my-0.5">air</span>
                    <span className="font-badge text-badge text-on-surface font-bold">14°</span>
                  </div>
                  <div className="bg-surface-container-low/60 rounded-lg p-1.5 flex flex-col items-center">
                    <span className="font-caption text-[11px] text-on-surface-variant">Thu</span>
                    <span className="material-symbols-outlined text-[16px] text-amber-500 my-0.5">sunny</span>
                    <span className="font-badge text-badge text-on-surface font-bold">16°</span>
                  </div>
                  <div className="bg-surface-container-low/60 rounded-lg p-1.5 flex flex-col items-center">
                    <span className="font-caption text-[11px] text-on-surface-variant">Fri</span>
                    <span className="material-symbols-outlined text-[16px] text-amber-500 my-0.5">sunny</span>
                    <span className="font-badge text-badge text-on-surface font-bold">18°</span>
                  </div>
                </div>

                {/* Best Visit Time */}
                <div className="flex items-center gap-2 mb-space-md text-on-surface-variant font-caption text-caption bg-surface-container-lowest py-1">
                  <span className="material-symbols-outlined text-secondary text-[16px]">alarm</span>
                  <span>
                    <strong className="text-on-surface">Best Visit:</strong>{' '}
                    {selectedPlace.bestVisitTime || '06:30 AM - 08:30 AM (Avoid midday crowds)'}
                  </span>
                </div>

                {/* Add to Trip Picker */}
                <div className="bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <label className="font-caption text-[10px] text-on-surface-variant uppercase font-bold pl-1 block">
                        Target Itinerary
                      </label>
                      <select
                        value={targetTripId}
                        onChange={(e) => setTargetTripId(e.target.value)}
                        className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded-lg font-body-medium text-small text-on-surface focus:outline-none shadow-xs cursor-pointer"
                      >
                        {trips.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-36 relative">
                      <label className="font-caption text-[10px] text-on-surface-variant uppercase font-bold pl-1 block">
                        Timeline Day
                      </label>
                      <select
                        value={targetDay}
                        onChange={(e) => setTargetDay(Number(e.target.value))}
                        className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded-lg font-body-medium text-small text-on-surface focus:outline-none shadow-xs cursor-pointer"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((day) => (
                          <option key={day} value={day}>
                            Day {day}: Nov {11 + day}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmAdd}
                    className="w-full h-10 bg-secondary hover:bg-secondary-container text-on-secondary font-button text-button rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors mt-0.5 cursor-pointer font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showAddSuccess ? 'check_circle' : 'bookmark_add'}
                    </span>
                    <span>
                      {showAddSuccess ? 'Added to Itinerary!' : 'Confirm & Add to Itinerary'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Third-Party Disclaimer */}
          <div className="p-space-md bg-surface-container-low rounded-xl flex items-start gap-3 border border-surface-container-high/40">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">info</span>
            <div className="flex flex-col">
              <span className="font-body-medium text-small text-on-surface font-semibold">
                Third-party data disclaimer
              </span>
              <p className="font-caption text-caption text-on-surface-variant mt-0.5 leading-relaxed">
                Map geometry, point-of-interest details, and meteorological forecasts are aggregated via open travel
                directories and weather APIs for planning purposes only. No direct bookings, reservations, or ticket
                sales are executed through TravelMate.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Interactive Map Modal */}
      <FullscreenMapModal
        isOpen={isFullscreenMapOpen}
        onClose={() => setIsFullscreenMapOpen(false)}
        selectedPlaceId={selectedPlaceId}
        onSelectPlaceId={setSelectedPlaceId}
        mapMode={mapMode}
        onChangeMapMode={setMapMode}
        zoomLevel={zoomLevel}
        onChangeZoomLevel={setZoomLevel}
        searchQuery={searchVal}
        onChangeSearchQuery={setSearchVal}
        selectedCategory={selectedCategory}
        onChangeCategory={setSelectedCategory}
        targetTripId={targetTripId}
        onChangeTargetTripId={setTargetTripId}
        targetDay={targetDay}
        onChangeTargetDay={setTargetDay}
        onConfirmAddToTrip={handleConfirmAdd}
        showAddSuccess={showAddSuccess}
      />
    </div>
  );
};
