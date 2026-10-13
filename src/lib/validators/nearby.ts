import { z } from 'zod';

export const nearbyQuerySchema = z.object({
  lat: z.coerce
    .number({ invalid_type_error: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be >= -90')
    .max(90, 'Latitude must be <= 90'),
  lon: z.coerce
    .number({ invalid_type_error: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be >= -180')
    .max(180, 'Longitude must be <= 180'),
  radius: z.coerce
    .number({ invalid_type_error: 'Radius must be a number' })
    .min(1000, 'Radius must be at least 1,000 meters (1 km)')
    .max(50000, 'Radius cannot exceed 50,000 meters (50 km)')
    .default(10000),
  tripId: z.string().trim().optional(),
});

export type NearbyQueryInput = z.infer<typeof nearbyQuerySchema>;

export interface NearbySpotItem {
  id: string;
  name: string;
  categoryLabel: string;
  category: string;
  address: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
}

export interface GeoapifyPlaceFeature {
  type: string;
  properties: {
    place_id?: string;
    osm_id?: number | string;
    name?: string;
    categories?: string[];
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    country?: string;
    distance?: number;
    lat?: number;
    lon?: number;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: [number, number]; // [lon, lat]
  };
}

export interface GeoapifyPlacesResponse {
  type: string;
  features?: GeoapifyPlaceFeature[];
}

/**
 * Maps Geoapify categories array to a clean human-readable badge label.
 */
export function getCategoryLabel(categories: string[] = []): { label: string; key: string } {
  const catSet = new Set(categories);

  if (catSet.has('heritage') || catSet.has('building.historic') || catSet.has('historic')) {
    return { label: 'Heritage', key: 'heritage' };
  }
  if (catSet.has('entertainment.museum') || catSet.has('museum')) {
    return { label: 'Museum', key: 'museum' };
  }
  if (catSet.has('leisure.park') || catSet.has('national_park') || catSet.has('park')) {
    return { label: 'Park', key: 'park' };
  }
  if (catSet.has('entertainment.culture') || catSet.has('culture')) {
    return { label: 'Culture', key: 'culture' };
  }
  if (catSet.has('tourism.attraction') || catSet.has('tourism.sights') || catSet.has('attraction')) {
    return { label: 'Attraction', key: 'attraction' };
  }

  return { label: 'Tourist Spot', key: 'tourism' };
}

/**
 * Calculates distance in meters between two lat/lng coordinates (Haversine formula).
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Filters, deduplicates, and maps Geoapify Places features to NearbySpotItem.
 * - Drops unnamed results.
 * - Deduplicates by normalized name and proximity (< 50m).
 * - Excludes places that match existing trip destination names or coordinates.
 * - Sorts results by distance ascending.
 */
export function filterAndMapNearbyPlaces(
  features: GeoapifyPlaceFeature[] = [],
  originLat: number,
  originLon: number,
  existingDestinations: Array<{ name: string; latitude?: number; longitude?: number }> = []
): NearbySpotItem[] {
  const existingNames = new Set(
    existingDestinations.map((d) => d.name.trim().toLowerCase())
  );

  const seenKeys = new Set<string>();
  const results: NearbySpotItem[] = [];

  for (const feat of features) {
    const props = feat.properties || {};
    const rawName = (props.name || '').trim();

    // 1. Drop unnamed results
    if (!rawName) continue;

    const normalizedName = rawName.toLowerCase();

    // 2. Extract coordinates
    const lat = props.lat ?? feat.geometry?.coordinates?.[1] ?? 0;
    const lon = props.lon ?? feat.geometry?.coordinates?.[0] ?? 0;

    if (lat === 0 && lon === 0) continue;

    // 3. Exclude places that match existing destinations of the trip
    const matchesExistingName =
      existingNames.has(normalizedName) ||
      Array.from(existingNames).some(
        (existing) => existing.includes(normalizedName) || normalizedName.includes(existing)
      );

    const matchesExistingCoords = existingDestinations.some(
      (d) =>
        typeof d.latitude === 'number' &&
        typeof d.longitude === 'number' &&
        d.latitude !== 0 &&
        d.longitude !== 0 &&
        Math.abs(d.latitude - lat) < 0.0005 &&
        Math.abs(d.longitude - lon) < 0.0005
    );

    if (matchesExistingName || matchesExistingCoords) {
      continue;
    }

    // 4. Deduplicate within the results by name or rounded coordinate bucket (~50m)
    const coordKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const dedupeKey = `${normalizedName}|${coordKey}`;
    if (seenKeys.has(dedupeKey) || seenKeys.has(normalizedName)) {
      continue;
    }
    seenKeys.add(dedupeKey);
    seenKeys.add(normalizedName);

    // 5. Determine distance
    const dist =
      typeof props.distance === 'number' && props.distance >= 0
        ? Math.round(props.distance)
        : calculateDistanceMeters(originLat, originLon, lat, lon);

    // 6. Format address
    const address =
      props.formatted ||
      [props.address_line1, props.city || props.country].filter(Boolean).join(', ') ||
      props.country ||
      '';

    const { label, key } = getCategoryLabel(props.categories);

    results.push({
      id: props.place_id || String(props.osm_id || `${lat}-${lon}-${results.length}`),
      name: rawName,
      categoryLabel: label,
      category: key,
      address,
      distanceMeters: dist,
      latitude: lat,
      longitude: lon,
    });
  }

  // Sort by distance ascending
  results.sort((a, b) => a.distanceMeters - b.distanceMeters);

  return results;
}
