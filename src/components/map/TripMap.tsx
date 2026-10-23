'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TripStatus } from '@/types';
import type { PlaceItem } from '@/lib/validators/places';

export interface TripMapDestination {
  id?: string;
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  orderIndex?: number;
  tripId?: string;
  tripTitle?: string;
  tripStatus?: TripStatus;
}

export interface TripMapExtraSpot {
  id: string;
  name: string;
  categoryLabel?: string;
  category?: string;
  distanceMeters?: number;
  latitude: number;
  longitude: number;
}

interface MapControllerProps {
  destinations: TripMapDestination[];
  extraSpots?: TripMapExtraSpot[];
  searchPlaces?: PlaceItem[];
  selectedId?: string | null;
  onMapClick?: () => void;
}

function MapController({
  destinations,
  extraSpots = [],
  searchPlaces = [],
  selectedId,
  onMapClick,
}: MapControllerProps) {
  const map = useMap();
  const prevCoordHash = useRef<string>('');

  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement;
      if (target.closest('.leaflet-marker-icon') || target.closest('.leaflet-control') || target.closest('.leaflet-popup')) {
        return;
      }
      onMapClick?.();
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onMapClick]);

  // Fit bounds when destinations, extra spots, or search places change
  useEffect(() => {
    const validCoords: [number, number][] = [];

    destinations.forEach((d) => {
      if (typeof d.latitude === 'number' && typeof d.longitude === 'number' && (d.latitude !== 0 || d.longitude !== 0)) {
        validCoords.push([d.latitude, d.longitude]);
      }
    });

    extraSpots.forEach((s) => {
      if (typeof s.latitude === 'number' && typeof s.longitude === 'number' && (s.latitude !== 0 || s.longitude !== 0)) {
        validCoords.push([s.latitude, s.longitude]);
      }
    });

    searchPlaces.forEach((p) => {
      if (typeof p.latitude === 'number' && typeof p.longitude === 'number' && (p.latitude !== 0 || p.longitude !== 0)) {
        validCoords.push([p.latitude, p.longitude]);
      }
    });

    const currentHash = validCoords.map((c) => `${c[0].toFixed(4)},${c[1].toFixed(4)}`).join(';');

    if (validCoords.length === 0) {
      map.setView([20, 0], 2);
      prevCoordHash.current = currentHash;
      return;
    }

    if (currentHash !== prevCoordHash.current) {
      prevCoordHash.current = currentHash;
      if (validCoords.length === 1) {
        map.flyTo(validCoords[0], 13, { duration: 0.8 });
      } else {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [map, destinations, extraSpots, searchPlaces]);

  // Pan when selected item changes
  useEffect(() => {
    if (!selectedId) return;

    const matchedDest = destinations.find((d) => (d.id || d.name) === selectedId);
    if (matchedDest && (matchedDest.latitude !== 0 || matchedDest.longitude !== 0)) {
      map.flyTo([matchedDest.latitude, matchedDest.longitude], Math.max(map.getZoom(), 14), {
        duration: 0.6,
      });
      return;
    }

    const matchedSpot = extraSpots.find((s) => s.id === selectedId);
    if (matchedSpot && (matchedSpot.latitude !== 0 || matchedSpot.longitude !== 0)) {
      map.flyTo([matchedSpot.latitude, matchedSpot.longitude], Math.max(map.getZoom(), 15), {
        duration: 0.6,
      });
      return;
    }

    const matchedSearch = searchPlaces.find((p) => p.id === selectedId);
    if (matchedSearch && (matchedSearch.latitude !== 0 || matchedSearch.longitude !== 0)) {
      map.flyTo([matchedSearch.latitude, matchedSearch.longitude], Math.max(map.getZoom(), 14), {
        duration: 0.6,
      });
    }
  }, [map, selectedId, destinations, extraSpots, searchPlaces]);

  return null;
}

function createDestinationMarkerIcon(
  dest: TripMapDestination,
  index: number,
  isSelected: boolean
): L.DivIcon {
  const numberTag = String((dest.orderIndex ?? index) + 1).padStart(2, '0');

  // Status color scheme or default primary teal
  let pinBg = 'bg-primary';
  if (dest.tripStatus === 'ongoing') {
    pinBg = 'bg-secondary';
  } else if (dest.tripStatus === 'completed') {
    pinBg = 'bg-slate-600 dark:bg-slate-500';
  } else if (isSelected) {
    pinBg = 'bg-secondary';
  }

  const selectedClass = isSelected
    ? 'scale-115 z-30 drop-shadow-xl ring-4 ring-secondary/50'
    : 'hover:scale-105 z-20 drop-shadow-md';

  const html = `
    <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-200 select-none ${selectedClass}">
      <div class="px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 shadow-sm mb-1 ${
        isSelected
          ? 'bg-secondary text-white ring-1 ring-white/50'
          : 'bg-surface-container-lowest text-on-surface border border-surface-container-high/70 dark:border-slate-700'
      }">
        <span class="font-mono">${numberTag}</span>
        <span class="max-w-[110px] truncate">${dest.name.split(',')[0]}</span>
      </div>
      <div class="relative">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white ${pinBg} shadow-md">
          <span class="material-symbols-outlined text-[17px]">location_on</span>
        </div>
        ${
          isSelected || dest.tripStatus === 'ongoing'
            ? '<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-secondary rotate-45"></span>'
            : '<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ' + (dest.tripStatus === 'completed' ? 'bg-slate-600' : 'bg-primary') + ' rotate-45"></span>'
        }
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-trip-marker',
    iconSize: [120, 56],
    iconAnchor: [60, 52],
  });
}

function createExtraSpotMarkerIcon(
  spot: TripMapExtraSpot,
  isSelected: boolean
): L.DivIcon {
  const selectedClass = isSelected
    ? 'scale-115 z-30 drop-shadow-xl ring-4 ring-secondary/50'
    : 'hover:scale-105 z-20 drop-shadow-md';

  const html = `
    <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-200 select-none ${selectedClass}">
      <div class="px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-sm mb-1 ${
        isSelected
          ? 'bg-secondary text-white'
          : 'bg-surface-container-lowest text-on-surface border border-surface-container-high/70 dark:border-slate-700'
      }">
        <span class="max-w-[100px] truncate block">${spot.name.split(',')[0]}</span>
      </div>
      <div class="w-7 h-7 rounded-full flex items-center justify-center text-white ${
        isSelected ? 'bg-secondary' : 'bg-[#7C3AED]'
      } shadow-md">
        <span class="material-symbols-outlined text-[15px]">tour</span>
      </div>
      <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 ${
        isSelected ? 'bg-secondary' : 'bg-[#7C3AED]'
      } rotate-45"></span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-spot-marker',
    iconSize: [110, 50],
    iconAnchor: [55, 46],
  });
}

function createSearchPlaceMarkerIcon(
  place: PlaceItem,
  index: number,
  isSelected: boolean
): L.DivIcon {
  const numberTag = String(index + 1).padStart(2, '0');
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

  const bgColor =
    place.category === 'attractions'
      ? 'bg-[#6D28D9]'
      : place.category === 'food'
      ? 'bg-[#B45309]'
      : place.category === 'nature'
      ? 'bg-[#047857]'
      : place.category === 'culture'
      ? 'bg-[#005454]'
      : 'bg-primary';

  const selectedClass = isSelected
    ? 'scale-115 z-30 drop-shadow-xl ring-4 ring-secondary/50'
    : 'hover:scale-105 z-20 drop-shadow-md';

  const html = `
    <div class="relative flex flex-col items-center cursor-pointer transition-transform duration-200 select-none ${selectedClass}">
      <div class="px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 shadow-sm mb-1 ${
        isSelected
          ? 'bg-secondary text-white ring-1 ring-white/50'
          : 'bg-surface-container-lowest text-on-surface border border-surface-container-high/60 dark:border-slate-700'
      }">
        <span class="font-mono">${numberTag}</span>
        <span class="max-w-[100px] truncate">${place.name.split(',')[0]}</span>
      </div>
      <div class="relative">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white ${
          isSelected ? 'bg-secondary' : bgColor
        } shadow-md">
          <span class="material-symbols-outlined text-[17px]">${iconName}</span>
        </div>
        ${
          isSelected
            ? '<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-secondary rotate-45"></span>'
            : ''
        }
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-search-marker',
    iconSize: [120, 56],
    iconAnchor: [60, 52],
  });
}

export interface TripMapProps {
  destinations?: TripMapDestination[];
  extraSpots?: TripMapExtraSpot[];
  searchPlaces?: PlaceItem[];
  selectedDestinationId?: string | null;
  selectedExtraSpotId?: string | null;
  selectedSearchPlaceId?: string | null;
  onSelectDestination?: (dest: TripMapDestination) => void;
  onSelectExtraSpot?: (spot: TripMapExtraSpot) => void;
  onSelectSearchPlace?: (place: PlaceItem) => void;
  onSelectTrip?: (tripId: string) => void;
  onMapClick?: () => void;
  onAddDestination?: () => void;
  showRouteLine?: boolean;
  className?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  allowEmptyMap?: boolean;
}

export const TripMap: React.FC<TripMapProps> = ({
  destinations = [],
  extraSpots = [],
  searchPlaces = [],
  selectedDestinationId,
  selectedExtraSpotId,
  selectedSearchPlaceId,
  onSelectDestination,
  onSelectExtraSpot,
  onSelectSearchPlace,
  onSelectTrip,
  onMapClick,
  onAddDestination,
  showRouteLine = true,
  className = '',
  emptyStateTitle = 'Add a destination to see the map',
  emptyStateDescription = 'Search and add waypoints to map your route, calculate distances, and inspect local tourist highlights.',
  allowEmptyMap = false,
}) => {
  // Filter valid destinations with real coordinates
  const validDestinations = useMemo(
    () =>
      destinations.filter(
        (d) =>
          typeof d.latitude === 'number' &&
          typeof d.longitude === 'number' &&
          !isNaN(d.latitude) &&
          !isNaN(d.longitude) &&
          (d.latitude !== 0 || d.longitude !== 0)
      ),
    [destinations]
  );

  const validSearchPlaces = useMemo(
    () =>
      searchPlaces.filter(
        (p) =>
          typeof p.latitude === 'number' &&
          typeof p.longitude === 'number' &&
          (p.latitude !== 0 || p.longitude !== 0)
      ),
    [searchPlaces]
  );

  // Generate route coordinates in chronological order
  const polylinePositions = useMemo(() => {
    if (!showRouteLine || validDestinations.length < 2) return [];
    return validDestinations.map((d) => [d.latitude, d.longitude] as [number, number]);
  }, [validDestinations, showRouteLine]);

  const hasAnyItems =
    validDestinations.length > 0 || extraSpots.length > 0 || validSearchPlaces.length > 0;

  // Empty state check
  if (!allowEmptyMap && !hasAnyItems) {
    return (
      <div
        className={`w-full min-h-[360px] rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center shadow-xs ${className}`}
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[36px]">add_location_alt</span>
        </div>
        <h3 className="font-section-title text-section-title text-on-surface font-bold">
          {emptyStateTitle}
        </h3>
        <p className="font-body text-body text-on-surface-variant max-w-sm mt-1 text-balance">
          {emptyStateDescription}
        </p>
        {onAddDestination && (
          <button
            type="button"
            onClick={onAddDestination}
            className="mt-5 h-[42px] px-5 rounded-xl bg-secondary hover:bg-secondary-container text-on-secondary font-button text-caption shadow-sm flex items-center gap-2 cursor-pointer font-semibold transition-all hover:scale-[1.02]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Destination</span>
          </button>
        )}
      </div>
    );
  }

  const activeSelectedId =
    selectedExtraSpotId || selectedDestinationId || selectedSearchPlaceId;

  const defaultCenter: [number, number] = validDestinations[0]
    ? [validDestinations[0].latitude, validDestinations[0].longitude]
    : validSearchPlaces[0]
    ? [validSearchPlaces[0].latitude, validSearchPlaces[0].longitude]
    : [20, 0];

  const defaultZoom = validDestinations.length === 1 ? 13 : validDestinations.length > 1 ? 8 : validSearchPlaces.length > 0 ? 12 : 2;

  return (
    <div className={`relative w-full h-full min-h-[360px] rounded-2xl overflow-hidden shadow-xs bg-surface-container border border-surface-container-high/60 dark:border-slate-800 ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        minZoom={2}
        maxZoom={18}
        zoomControl={true}
        attributionControl={false}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
        touchZoom={true}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController
          destinations={validDestinations}
          extraSpots={extraSpots}
          searchPlaces={validSearchPlaces}
          selectedId={activeSelectedId}
          onMapClick={onMapClick}
        />

        {/* Dashed route line connecting destinations in order */}
        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#0D6E6E',
              weight: 3.5,
              opacity: 0.85,
              dashArray: '6, 8',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Search Place Markers */}
        {validSearchPlaces.map((place, idx) => {
          const isSelected = place.id === selectedSearchPlaceId;
          const icon = createSearchPlaceMarkerIcon(place, idx, isSelected);

          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectSearchPlace?.(place),
              }}
            />
          );
        })}

        {/* Destination Markers */}
        {validDestinations.map((dest, idx) => {
          const isSelected = (dest.id || dest.name) === selectedDestinationId;
          const icon = createDestinationMarkerIcon(dest, idx, isSelected);

          return (
            <Marker
              key={dest.id || `dest-${dest.latitude}-${dest.longitude}-${idx}`}
              position={[dest.latitude, dest.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectDestination?.(dest),
              }}
            >
              <Tooltip direction="top" offset={[0, -25]} opacity={0.95}>
                <div className="font-sans text-xs">
                  <div className="font-bold text-slate-900">{dest.name}</div>
                  {dest.country && <div className="text-[10px] text-slate-500">{dest.country}</div>}
                  {dest.tripTitle && (
                    <div className="text-[10px] font-semibold text-primary mt-0.5">
                      Trip: {dest.tripTitle}
                    </div>
                  )}
                </div>
              </Tooltip>

              {dest.tripId && (
                <Popup>
                  <div className="p-1 font-sans text-xs max-w-[200px]">
                    <div className="font-bold text-slate-900">{dest.name}</div>
                    {dest.country && <div className="text-[11px] text-slate-500">{dest.country}</div>}
                    {dest.tripTitle && (
                      <div className="mt-1 font-semibold text-primary">
                        {dest.tripTitle}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectTrip?.(dest.tripId!)}
                      className="mt-2 w-full py-1 px-2 bg-primary text-white text-[11px] font-semibold rounded hover:bg-primary-container transition-colors cursor-pointer"
                    >
                      Open Trip
                    </button>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}

        {/* Extra Spots Markers (Recommended Nearby Tourist Spots) */}
        {extraSpots.map((spot) => {
          const isSelected = spot.id === selectedExtraSpotId;
          const icon = createExtraSpotMarkerIcon(spot, isSelected);

          return (
            <Marker
              key={spot.id}
              position={[spot.latitude, spot.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectExtraSpot?.(spot),
              }}
            >
              <Tooltip direction="top" offset={[0, -22]} opacity={0.95}>
                <div className="font-sans text-xs">
                  <div className="font-bold text-slate-900">{spot.name}</div>
                  {spot.categoryLabel && (
                    <span className="text-[10px] font-semibold text-purple-700">
                      {spot.categoryLabel}
                    </span>
                  )}
                  {typeof spot.distanceMeters === 'number' && (
                    <span className="text-[10px] text-slate-500 ml-1">
                      • {(spot.distanceMeters / 1000).toFixed(1)} km away
                    </span>
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default TripMap;
