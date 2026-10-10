import React, { useState, useEffect, useRef } from 'react';
import { useTravelStore } from '../store';
import { PlacePOI } from '../types';

interface FullscreenMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlaceId: string;
  onSelectPlaceId: (id: string) => void;
  mapMode: 'default' | 'satellite' | 'elevation';
  onChangeMapMode: (mode: 'default' | 'satellite' | 'elevation') => void;
  zoomLevel: number;
  onChangeZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  selectedCategory: string;
  onChangeCategory: (category: string) => void;
  targetTripId: string;
  onChangeTargetTripId: (tripId: string) => void;
  targetDay: number;
  onChangeTargetDay: (day: number) => void;
  onConfirmAddToTrip: () => void;
  showAddSuccess: boolean;
}

export const FullscreenMapModal: React.FC<FullscreenMapModalProps> = ({
  isOpen,
  onClose,
  selectedPlaceId,
  onSelectPlaceId,
  mapMode,
  onChangeMapMode,
  zoomLevel,
  onChangeZoomLevel,
  searchQuery,
  onChangeSearchQuery,
  selectedCategory,
  onChangeCategory,
  targetTripId,
  onChangeTargetTripId,
  targetDay,
  onChangeTargetDay,
  onConfirmAddToTrip,
  showAddSuccess,
}) => {
  const { places, trips, toggleSavePlace } = useTravelStore();

  // Collapsible Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState<'list' | 'detail'>('list');

  // Map Pan Offset State for interactive dragging
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number } | null>(null);

  // Layer Toggles
  const [showRouteLayer, setShowRouteLayer] = useState(true);
  const [showWeatherBadges, setShowWeatherBadges] = useState(true);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) || places[0];

  // Auto-switch to detail tab when a place is selected if drawer is open
  const handleSelectPlace = (placeId: string, focusOnMap = true) => {
    onSelectPlaceId(placeId);
    setDrawerTab('detail');
    if (!isDrawerOpen) {
      setIsDrawerOpen(true);
    }

    if (focusOnMap) {
      const place = places.find((p) => p.id === placeId);
      if (place && containerRef.current) {
        // Center pan on the selected pin
        const rect = containerRef.current.getBoundingClientRect();
        const targetX = (0.5 - place.pinCoordinates.xPercent / 100) * (rect.width * 0.85);
        const targetY = (0.5 - place.pinCoordinates.yPercent / 100) * (rect.height * 0.85);
        setPanOffset({ x: Math.round(targetX), y: Math.round(targetY) });
      }
    }
  };

  // Filtered places
  const filteredPlaces = places.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'rated'
        ? p.rating >= 4.8
        : p.category === selectedCategory;

    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ward.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Reset Center & Pan
  const handleResetCenter = () => {
    setPanOffset({ x: 0, y: 0 });
    onChangeZoomLevel(1);
  };

  // Keyboard shortcut handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        onChangeZoomLevel((z) => Math.min(z + 0.2, 2.2));
      } else if (e.key === '-' || e.key === '_') {
        onChangeZoomLevel((z) => Math.max(z - 0.2, 0.75));
      } else if (e.key === '0' || e.key === 'c' || e.key === 'C') {
        handleResetCenter();
      } else if (e.key === 'd' || e.key === 'D') {
        // Toggle drawer unless typing in an input
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
          setIsDrawerOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onChangeZoomLevel]);

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
      // In case iframe blocks full native screen, modal overlay already provides true viewport coverage
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

  // Mouse drag handlers for interactive panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left mouse button and not on interactive controls
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('.no-drag')) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPanOffset({
      x: dragStartRef.current.initialPanX + dx,
      y: dragStartRef.current.initialPanY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;
    setPanOffset({
      x: dragStartRef.current.initialPanX + dx,
      y: dragStartRef.current.initialPanY + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      onChangeZoomLevel((z) => Math.min(z + 0.1, 2.2));
    } else {
      onChangeZoomLevel((z) => Math.max(z - 0.1, 0.75));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-200 select-none"
    >
      {/* Top Floating Glass App Bar */}
      <header className="relative z-40 px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-3 shadow-lg shrink-0">
        {/* Left: Back / Exit & Title */}
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
                Kyoto Expedition Map
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                Interactive Fullscreen Explorer • {filteredPlaces.length} POIs
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right: Map Layers, Styles & Drawer Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Map Mode Switcher */}
          <div className="hidden md:flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => onChangeMapMode('default')}
              type="button"
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                mapMode === 'default'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => onChangeMapMode('satellite')}
              type="button"
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => onChangeMapMode('elevation')}
              type="button"
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                mapMode === 'elevation'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Elevation
            </button>
          </div>

          {/* Route Layer Toggle */}
          <button
            onClick={() => setShowRouteLayer((prev) => !prev)}
            type="button"
            className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              showRouteLayer
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Itinerary Route Trail"
          >
            <span className="material-symbols-outlined text-[16px]">route</span>
            <span>Route</span>
          </button>

          {/* Weather Badges Toggle */}
          <button
            onClick={() => setShowWeatherBadges((prev) => !prev)}
            type="button"
            className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              showWeatherBadges
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Live Weather Pins"
          >
            <span className="material-symbols-outlined text-[16px]">sunny</span>
            <span>Forecast</span>
          </button>

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

      {/* Main Fullscreen Body: Map Canvas & Floating Collapsible Overlay Drawer */}
      <div
        className={`relative flex-1 w-full h-full overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Fullscreen Map Canvas Layer */}
        <div
          className="absolute inset-0 w-full h-full transition-transform duration-100 ease-out pointer-events-none"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Map Base Graphic */}
          <div
            className="absolute inset-[-40%] w-[180%] h-[180%] bg-cover bg-center transition-all duration-300"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDIoPcM7w2dBQR29bkdxMOblbST_gCRKeRHiIzFxM0kX1So8zQAGVZjYi9QIQR-rMsD46ZglL7OMPxR21T5JMRSIuRi2riE1nHCnUrVeVrcGlj4NInFpVuykyCbgQ-r-FpJDvFkI9F5hcav5As4UfusSUMGwyH7JiBmB6OtC9Zh2RS-EB14l-WYV_rNEuA0Q7GoijNw3Dt5gyDQRHtMnMYzqSkuT7BWQrlgFNmZa0jqjW4ZdBjCkSzvJQ')",
              filter:
                mapMode === 'satellite'
                  ? 'contrast(1.2) brightness(0.85) saturate(1.1)'
                  : mapMode === 'elevation'
                  ? 'sepia(0.2) contrast(1.15) brightness(0.95)'
                  : 'brightness(0.92)',
            }}
          />

          {/* Atmospheric Grid Overlay */}
          <div
            className="absolute inset-[-40%] w-[180%] h-[180%] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 50%, rgba(20, 184, 166, 0.04) 0%, rgba(15, 23, 42, 0.4) 100%)',
            }}
          />

          {/* SVG Polyline connecting Kyoto POIs in Expedition Sequence */}
          {showRouteLayer && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Connecting Polyline */}
              <polyline
                points={places
                  .map((p) => `${p.pinCoordinates.xPercent}%,${p.pinCoordinates.yPercent}%`)
                  .join(' ')}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="3.5"
                strokeDasharray="6,4"
                className="animate-pulse"
              />
            </svg>
          )}

          {/* Interactive POI Pins */}
          {places.map((place) => {
            const isSelected = selectedPlaceId === place.id;
            const isVisible = filteredPlaces.some((fp) => fp.id === place.id);
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPlace(place.id, false);
                }}
                style={{
                  top: `${coords.yPercent}%`,
                  left: `${coords.xPercent}%`,
                  opacity: isVisible ? 1 : 0.35,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-pointer transition-transform duration-200 group no-drag ${
                  isSelected ? 'z-30 scale-125' : 'z-20 hover:scale-115'
                }`}
              >
                {/* Pin Label with Spot Name & Category */}
                <div
                  className={`px-2.5 py-1 rounded-lg shadow-xl mb-1 text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white ring-2 ring-emerald-400 shadow-emerald-500/20'
                      : 'bg-slate-900/90 text-slate-200 group-hover:bg-slate-900 group-hover:text-white border border-slate-700/80'
                  }`}
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                  <span className="font-bold text-emerald-400">{place.numberTag}</span>
                  <span className="truncate max-w-[120px]">{place.name}</span>
                  {showWeatherBadges && place.tempC && (
                    <span className="text-[10px] text-amber-300 font-mono pl-0.5">
                      {place.tempC}°
                    </span>
                  )}
                </div>

                {/* Circular Pin Icon */}
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-400/40 shadow-emerald-500/50'
                        : place.category === 'culture'
                        ? 'bg-purple-600 text-white'
                        : place.category === 'food'
                        ? 'bg-amber-600 text-white'
                        : place.category === 'nature'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                  </div>

                  {isSelected && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-emerald-500 rotate-45 shadow-sm" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Collapsible Overlay Drawer on the Map (Desktop side panel, Mobile bottom sheet with snap points) */}
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
                    <span>Spots ({filteredPlaces.length})</span>
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

              {/* Instant Search Bar */}
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onChangeSearchQuery(e.target.value)}
                  placeholder="Filter Kyoto shrines, dining, gardens..."
                  className="w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-9 pr-8 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => onChangeSearchQuery('')}
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => onChangeCategory('all')}
                  type="button"
                  className={`h-6 px-2.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-500 text-white'
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
                      ? 'bg-purple-600 text-white'
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
                      ? 'bg-amber-600 text-white'
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
                      ? 'bg-emerald-600 text-white'
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Culture
                </button>
                <button
                  onClick={() => onChangeCategory('rated')}
                  type="button"
                  className={`h-6 px-2.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    selectedCategory === 'rated'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">star</span>
                  <span>4.8+</span>
                </button>
              </div>
            </div>

            {/* Drawer Body Tab 1: Scrollable Spots List */}
            {drawerTab === 'list' && (
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
                {filteredPlaces.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[32px] text-slate-500">search_off</span>
                    <span className="text-xs font-semibold">No spots match your filters</span>
                    <button
                      onClick={() => {
                        onChangeSearchQuery('');
                        onChangeCategory('all');
                      }}
                      type="button"
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Clear search &amp; filters
                    </button>
                  </div>
                ) : (
                  filteredPlaces.map((place) => {
                    const isSelected = selectedPlaceId === place.id;
                    return (
                      <div
                        key={place.id}
                        onClick={() => handleSelectPlace(place.id, true)}
                        className={`p-2.5 rounded-xl transition-all cursor-pointer border flex gap-3 relative ${
                          isSelected
                            ? 'bg-slate-800/95 border-emerald-500 ring-1 ring-emerald-500/40 shadow-md'
                            : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60'
                        }`}
                      >
                        {/* Image Thumbnail */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative bg-slate-950">
                          <img
                            src={place.image}
                            alt={place.imageAlt}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`absolute top-1 left-1 text-[9px] px-1 py-0.5 rounded font-bold ${
                              isSelected
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-900/80 text-emerald-400'
                            }`}
                          >
                            {place.numberTag}
                          </span>
                        </div>

                        {/* Text info */}
                        <div className="flex flex-col justify-between min-w-0 flex-1">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                                {place.categoryLabel}
                              </span>
                              <div className="flex items-center gap-0.5 text-amber-400 text-[11px] font-bold">
                                <span className="material-symbols-outlined text-[13px]">star</span>
                                <span>{place.rating}</span>
                              </div>
                            </div>

                            <h4 className="text-xs font-bold text-white truncate font-display">
                              {place.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {place.ward}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            {place.tempC && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px] text-amber-400">
                                  wb_sunny
                                </span>
                                <span>{place.tempC}°C</span>
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 ml-auto">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSavePlace(place.id);
                                }}
                                type="button"
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  place.isSaved
                                    ? 'text-amber-400 hover:text-amber-300'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                                title={place.isSaved ? 'Bookmarked' : 'Bookmark Spot'}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {place.isSaved ? 'bookmark' : 'bookmark_border'}
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectPlaceId(place.id);
                                  setDrawerTab('detail');
                                }}
                                type="button"
                                className="px-2 py-0.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-semibold transition-colors cursor-pointer"
                              >
                                Inspect
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Drawer Body Tab 2: Selected Spot Inspector */}
            {drawerTab === 'detail' && selectedPlace && (
              <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3">
                {/* Spot Photo & Overlay Info */}
                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700/60 shadow-md">
                  <img
                    src={selectedPlace.image}
                    alt={selectedPlace.imageAlt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  <span className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700">
                    SPOT {selectedPlace.numberTag} • {selectedPlace.categoryLabel}
                  </span>

                  <button
                    onClick={() => toggleSavePlace(selectedPlace.id)}
                    type="button"
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white hover:text-amber-400 transition-colors cursor-pointer"
                    title={selectedPlace.isSaved ? 'Remove bookmark' : 'Bookmark spot'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {selectedPlace.isSaved ? 'bookmark' : 'bookmark_border'}
                    </span>
                  </button>

                  <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white drop-shadow font-display">
                        {selectedPlace.name}
                      </h3>
                      <p className="text-[11px] text-slate-300 drop-shadow">
                        {selectedPlace.ward}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-500/90 backdrop-blur-md text-slate-950 px-2 py-0.5 rounded-md font-bold text-xs">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      <span>{selectedPlace.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Live Weather Forecast Card */}
                <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-400 text-[22px]">
                        wb_sunny
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-white">
                          {selectedPlace.weatherText || '16°C • Clear & Crisp'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Light Breeze • Ideal for walking
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                      Live Weather
                    </span>
                  </div>

                  {/* 5-Day Micro Strip */}
                  <div className="grid grid-cols-5 gap-1 pt-1 text-center border-t border-slate-700/60">
                    <div className="p-1 rounded bg-slate-900/40">
                      <span className="text-[9px] text-slate-400 block">Today</span>
                      <span className="text-xs font-bold text-amber-400">17°</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900/40">
                      <span className="text-[9px] text-slate-400 block">Tue</span>
                      <span className="text-xs font-bold text-slate-300">15°</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900/40">
                      <span className="text-[9px] text-slate-400 block">Wed</span>
                      <span className="text-xs font-bold text-slate-300">14°</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900/40">
                      <span className="text-[9px] text-slate-400 block">Thu</span>
                      <span className="text-xs font-bold text-amber-400">16°</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900/40">
                      <span className="text-[9px] text-slate-400 block">Fri</span>
                      <span className="text-xs font-bold text-amber-400">18°</span>
                    </div>
                  </div>
                </div>

                {/* Best Visit Recommendation */}
                <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300">
                  <span className="material-symbols-outlined text-amber-400 text-[18px] shrink-0 mt-0.5">
                    alarm
                  </span>
                  <div>
                    <span className="font-semibold text-white">Best Visit Window:</span>{' '}
                    <span className="text-slate-300">
                      {selectedPlace.bestVisitTime || '06:30 AM - 08:30 AM (Avoid midday crowds)'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {selectedPlace.description && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/30 p-2.5 rounded-xl border border-slate-700/40">
                    {selectedPlace.description}
                  </p>
                )}

                {/* Center on Map Action */}
                <button
                  onClick={() => handleSelectPlace(selectedPlace.id, true)}
                  type="button"
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">my_location</span>
                  <span>Center Pin on Map</span>
                </button>

                {/* Add to Trip Section */}
                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col gap-2 mt-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Add to Expedition Itinerary
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-0.5">Trip</label>
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
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-0.5">Day</label>
                      <select
                        value={targetDay}
                        onChange={(e) => onChangeTargetDay(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
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
                    onClick={onConfirmAddToTrip}
                    type="button"
                    className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer mt-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showAddSuccess ? 'check_circle' : 'bookmark_add'}
                    </span>
                    <span>
                      {showAddSuccess ? 'Added to Itinerary!' : 'Confirm & Add Spot'}
                    </span>
                  </button>
                </div>
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
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">
              location_on
            </span>
            <span className="text-xs font-bold font-display">
              Kyoto Spots ({filteredPlaces.length})
            </span>
            <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
              chevron_right
            </span>
          </button>
        )}

        {/* Floating Zoom & Map Center Controls (Bottom-Right) */}
        <div className="no-drag absolute bottom-6 right-6 z-30 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
          <button
            onClick={() => onChangeZoomLevel((z) => Math.min(z + 0.2, 2.2))}
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom In [+]"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <button
            onClick={() => onChangeZoomLevel((z) => Math.max(z - 0.2, 0.75))}
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zoom Out [-]"
          >
            <span className="material-symbols-outlined text-[20px]">remove</span>
          </button>
          <div className="h-px w-6 bg-slate-800 mx-auto my-0.5" />
          <button
            onClick={handleResetCenter}
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Center Map & Reset Zoom [0]"
          >
            <span className="material-symbols-outlined text-[20px]">my_location</span>
          </button>
        </div>

        {/* Bottom Helper Bar: Navigation Hints & Scale */}
        <div className="no-drag absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800/80 text-[11px] text-slate-400 pointer-events-none z-20">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Drag to pan</span>
          </span>
          <span>•</span>
          <span>Scroll or +/- to zoom</span>
          <span>•</span>
          <span>Press Esc to exit</span>
          <span>•</span>
          <span className="font-mono text-slate-300">Zoom: {Math.round(zoomLevel * 100)}%</span>
        </div>

        {/* Mini Scale Indicator */}
        <div className="no-drag absolute bottom-6 left-6 z-20 hidden sm:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-mono pointer-events-none">
          <div className="w-8 h-1 bg-slate-400 rounded-full" />
          <span>500 m</span>
        </div>
      </div>
    </div>
  );
};
