'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PlaceItem } from '@/lib/validators/places';

// Helper component to auto-pan / fit bounds
function MapController({
  places,
  selectedPlace,
  onMapClick,
}: {
  places: PlaceItem[];
  selectedPlace: PlaceItem | null;
  onMapClick?: () => void;
}) {
  const map = useMap();
  const prevPlacesRef = useRef<PlaceItem[]>(places);

  // Click on empty map area triggers onMapClick (to dismiss drawer)
  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement;
      // Don't dismiss if clicked on a marker or control
      if (target.closest('.leaflet-marker-icon') || target.closest('.leaflet-control')) {
        return;
      }
      onMapClick?.();
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, onMapClick]);

  // Fit bounds when search places change
  useEffect(() => {
    if (places.length === 0) {
      map.setView([20, 0], 2);
      return;
    }

    // Check if places array actually changed
    const hasChanged =
      places.length !== prevPlacesRef.current.length ||
      places.some((p, i) => p.id !== prevPlacesRef.current[i]?.id);

    if (hasChanged) {
      prevPlacesRef.current = places;
      if (places.length === 1) {
        map.flyTo([places[0].latitude, places[0].longitude], 13, { duration: 0.8 });
      } else {
        const bounds = L.latLngBounds(
          places.map((p) => [p.latitude, p.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [map, places]);

  // Pan when selected place changes
  useEffect(() => {
    if (selectedPlace) {
      map.flyTo([selectedPlace.latitude, selectedPlace.longitude], Math.max(map.getZoom(), 14), {
        duration: 0.6,
      });
    }
  }, [map, selectedPlace]);

  return null;
}

export interface LeafletMapProps {
  places: PlaceItem[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (place: PlaceItem) => void;
  onMapClick?: () => void;
  className?: string;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
}

/**
 * Creates custom divIcon matching TravelMate design tokens
 */
function createMarkerIcon(place: PlaceItem, index: number, isSelected: boolean): L.DivIcon {
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
          : 'bg-surface-container-lowest text-on-surface border border-surface-container-high/60'
      }">
        <span>${numberTag}</span>
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
    className: 'custom-leaflet-marker',
    iconSize: [120, 56],
    iconAnchor: [60, 52],
  });
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  places,
  selectedPlaceId,
  onSelectPlace,
  onMapClick,
  className = '',
}) => {
  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) || null,
    [places, selectedPlaceId]
  );

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController
          places={places}
          selectedPlace={selectedPlace}
          onMapClick={onMapClick}
        />

        {places.map((place, idx) => {
          const isSelected = place.id === selectedPlaceId;
          const icon = createMarkerIcon(place, idx, isSelected);

          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectPlace?.(place),
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
