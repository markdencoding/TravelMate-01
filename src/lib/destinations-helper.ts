import { Trip, TripDestination } from '@/types';
import { TripMapDestination } from '@/components/map/TripMap';

/**
 * Curated fallback coordinates for popular travel regions & sample trip destinations.
 * Used when destinations lack explicit coordinates in legacy or sample records.
 */
export const SAMPLE_COORDINATES: Record<string, { lat: number; lng: number; country: string }> = {
  kyoto: { lat: 35.0116, lng: 135.7681, country: 'Japan' },
  tokyo: { lat: 35.6762, lng: 139.6503, country: 'Japan' },
  osaka: { lat: 34.6937, lng: 135.5023, country: 'Japan' },
  amalfi: { lat: 40.6340, lng: 14.6027, country: 'Italy' },
  ravello: { lat: 40.6491, lng: 14.6124, country: 'Italy' },
  capri: { lat: 40.5507, lng: 14.2426, country: 'Italy' },
  'el chaltén': { lat: -49.3315, lng: -72.8863, country: 'Argentina' },
  'el chalten': { lat: -49.3315, lng: -72.8863, country: 'Argentina' },
  'el calafate': { lat: -50.3380, lng: -72.2648, country: 'Argentina' },
  patagonia: { lat: -49.3315, lng: -72.8863, country: 'Argentina' },
  manila: { lat: 14.5995, lng: 120.9842, country: 'Philippines' },
  cebu: { lat: 10.3157, lng: 123.8854, country: 'Philippines' },
  boracay: { lat: 11.9674, lng: 121.9248, country: 'Philippines' },
  palawan: { lat: 9.8349, lng: 118.7384, country: 'Philippines' },
  siargao: { lat: 9.8580, lng: 126.0467, country: 'Philippines' },
  paris: { lat: 48.8566, lng: 2.3522, country: 'France' },
  rome: { lat: 41.9028, lng: 12.4964, country: 'Italy' },
  london: { lat: 51.5074, lng: -0.1278, country: 'United Kingdom' },
  'new york': { lat: 40.7128, lng: -74.0060, country: 'United States' },
  barcelona: { lat: 41.3879, lng: 2.1699, country: 'Spain' },
  bangkok: { lat: 13.7563, lng: 100.5018, country: 'Thailand' },
  singapore: { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  bali: { lat: -8.4095, lng: 115.1889, country: 'Indonesia' },
  reykjavik: { lat: 64.1466, lng: -21.9426, country: 'Iceland' },
  zurich: { lat: 47.3769, lng: 8.5417, country: 'Switzerland' },
};

/**
 * Normalizes and extracts map destinations from a Trip, using:
 * 1. Explicit trip.destinationsData (with real lat/lng)
 * 2. Fallback coordinates for names in trip.destinations or trip.destinationRegion
 */
export function resolveTripDestinations(trip: Trip): TripMapDestination[] {
  if (!trip) return [];

  // 1. If trip has structured destinationsData with valid coordinates
  if (trip.destinationsData && trip.destinationsData.length > 0) {
    const valid = trip.destinationsData.filter(
      (d) =>
        typeof d.latitude === 'number' &&
        typeof d.longitude === 'number' &&
        !isNaN(d.latitude) &&
        !isNaN(d.longitude) &&
        (d.latitude !== 0 || d.longitude !== 0)
    );

    if (valid.length > 0) {
      return valid.map((d, idx) => ({
        id: d.id || `${trip.id}-dest-${idx}`,
        name: d.name,
        country: d.country || trip.country || '',
        latitude: d.latitude,
        longitude: d.longitude,
        orderIndex: d.orderIndex ?? idx,
        tripId: trip.id,
        tripTitle: trip.title,
        tripStatus: trip.status,
      }));
    }
  }

  // 2. Derive destination names from trip.destinations or destinationRegion
  const rawNames: string[] = [];
  if (trip.destinations && trip.destinations.length > 0) {
    rawNames.push(...trip.destinations);
  } else if (trip.destinationRegion) {
    rawNames.push(
      ...trip.destinationRegion
        .split(/&|,|➔|\//)
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  const results: TripMapDestination[] = [];

  rawNames.forEach((name, idx) => {
    const cleanKey = name.toLowerCase().trim();
    const matched =
      SAMPLE_COORDINATES[cleanKey] ||
      Object.entries(SAMPLE_COORDINATES).find(([k]) => cleanKey.includes(k) || k.includes(cleanKey))?.[1];

    if (matched) {
      results.push({
        id: `${trip.id}-sample-${idx}`,
        name,
        country: trip.country || matched.country,
        latitude: matched.lat,
        longitude: matched.lng,
        orderIndex: idx,
        tripId: trip.id,
        tripTitle: trip.title,
        tripStatus: trip.status,
      });
    }
  });

  return results;
}
