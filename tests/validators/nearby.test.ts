import { describe, it, expect } from 'vitest';
import {
  nearbyQuerySchema,
  calculateDistanceMeters,
  getCategoryLabel,
  filterAndMapNearbyPlaces,
  type GeoapifyPlaceFeature,
} from '@/lib/validators/nearby';
import { calculateTripStatus } from '@/lib/trip-status';

describe('Nearby Places Validator and Mappers', () => {
  describe('nearbyQuerySchema', () => {
    it('accepts valid coordinates and radius', () => {
      const res = nearbyQuerySchema.safeParse({
        lat: '35.0116',
        lon: '135.7681',
        radius: '10000',
        tripId: 'trip-123',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.lat).toBe(35.0116);
        expect(res.data.lon).toBe(135.7681);
        expect(res.data.radius).toBe(10000);
        expect(res.data.tripId).toBe('trip-123');
      }
    });

    it('defaults radius to 10,000 meters if not supplied', () => {
      const res = nearbyQuerySchema.safeParse({
        lat: 0,
        lon: 0,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.radius).toBe(10000);
      }
    });

    it('rejects latitudes outside [-90, 90]', () => {
      expect(nearbyQuerySchema.safeParse({ lat: 95, lon: 0 }).success).toBe(false);
      expect(nearbyQuerySchema.safeParse({ lat: -91, lon: 0 }).success).toBe(false);
    });

    it('rejects longitudes outside [-180, 180]', () => {
      expect(nearbyQuerySchema.safeParse({ lat: 0, lon: 181 }).success).toBe(false);
      expect(nearbyQuerySchema.safeParse({ lat: 0, lon: -185 }).success).toBe(false);
    });

    it('rejects radius under 1,000m or over 50,000m', () => {
      expect(nearbyQuerySchema.safeParse({ lat: 0, lon: 0, radius: 500 }).success).toBe(false);
      expect(nearbyQuerySchema.safeParse({ lat: 0, lon: 0, radius: 60000 }).success).toBe(false);
    });
  });

  describe('calculateDistanceMeters', () => {
    it('calculates accurate distance between known coordinates (Kyoto Station to Fushimi Inari ~2.8km)', () => {
      const kyotoStation = { lat: 34.9858, lon: 135.7588 };
      const fushimiInari = { lat: 34.9671, lon: 135.7727 };
      const dist = calculateDistanceMeters(
        kyotoStation.lat,
        kyotoStation.lon,
        fushimiInari.lat,
        fushimiInari.lon
      );
      // Distance is ~2.4km - 2.8km
      expect(dist).toBeGreaterThan(2000);
      expect(dist).toBeLessThan(3000);
    });

    it('returns 0 for identical coordinates', () => {
      expect(calculateDistanceMeters(35.0, 135.0, 35.0, 135.0)).toBe(0);
    });
  });

  describe('getCategoryLabel', () => {
    it('maps museum and heritage categories', () => {
      const res = getCategoryLabel(['entertainment.museum', 'tourism.attraction']);
      expect(res.key).toBe('museum');
      expect(res.label).toBe('Museum');
    });

    it('maps park and nature categories', () => {
      const res = getCategoryLabel(['leisure.park', 'natural']);
      expect(res.label).toBe('Park');
      expect(res.key).toBe('park');
    });

    it('maps heritage categories', () => {
      const res = getCategoryLabel(['heritage']);
      expect(res.label).toBe('Heritage');
      expect(res.key).toBe('heritage');
    });

    it('falls back to Tourist Spot for unspecified categories', () => {
      const res = getCategoryLabel(['general']);
      expect(res.label).toBe('Tourist Spot');
      expect(res.key).toBe('tourism');
    });
  });

  describe('filterAndMapNearbyPlaces', () => {
    it('drops unnamed features without name', () => {
      const feature: GeoapifyPlaceFeature = {
        type: 'Feature',
        properties: {
          categories: ['tourism.attraction'],
        },
        geometry: {
          type: 'Point',
          coordinates: [135.75, 35.0],
        },
      };
      const mapped = filterAndMapNearbyPlaces([feature], 35.0, 135.75, []);
      expect(mapped.length).toBe(0);
    });

    it('correctly maps named feature to NearbySpotItem', () => {
      const feature: GeoapifyPlaceFeature = {
        type: 'Feature',
        properties: {
          place_id: 'geo-123',
          name: 'Kinkaku-ji Temple',
          categories: ['heritage', 'tourism.attraction'],
          formatted: '1 Kinkakujicho, Kita Ward, Kyoto',
          lat: 35.0394,
          lon: 135.7292,
        },
        geometry: {
          type: 'Point',
          coordinates: [135.7292, 35.0394],
        },
      };
      const mapped = filterAndMapNearbyPlaces([feature], 35.03, 135.72, []);
      expect(mapped.length).toBe(1);
      expect(mapped[0].name).toBe('Kinkaku-ji Temple');
      expect(mapped[0].categoryLabel).toBe('Heritage');
      expect(mapped[0].address).toBe('1 Kinkakujicho, Kita Ward, Kyoto');
      expect(mapped[0].latitude).toBe(35.0394);
      expect(mapped[0].longitude).toBe(135.7292);
      expect(mapped[0].distanceMeters).toBeGreaterThan(0);
    });

    it('drops duplicates by name or location', () => {
      const features: GeoapifyPlaceFeature[] = [
        {
          type: 'Feature',
          properties: {
            place_id: '1',
            name: 'Kyoto Imperial Palace',
            categories: ['heritage'],
            formatted: 'Kyoto',
            lat: 35.025,
            lon: 135.762,
          },
          geometry: { type: 'Point', coordinates: [135.762, 35.025] },
        },
        {
          type: 'Feature',
          properties: {
            place_id: '2',
            name: 'Kyoto Imperial Palace', // Duplicate name
            categories: ['leisure.park'],
            formatted: 'Kyoto Park',
            lat: 35.026,
            lon: 135.763,
          },
          geometry: { type: 'Point', coordinates: [135.763, 35.026] },
        },
      ];
      const result = filterAndMapNearbyPlaces(features, 35.02, 135.76, []);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Kyoto Imperial Palace');
    });

    it('excludes spots that match existing destinations of the selected trip', () => {
      const features: GeoapifyPlaceFeature[] = [
        {
          type: 'Feature',
          properties: {
            place_id: '1',
            name: 'Arashiyama Bamboo Grove',
            categories: ['tourism.attraction'],
            formatted: 'Arashiyama, Kyoto',
            lat: 35.016,
            lon: 135.671,
          },
          geometry: { type: 'Point', coordinates: [135.671, 35.016] },
        },
        {
          type: 'Feature',
          properties: {
            place_id: '2',
            name: 'Tenryu-ji',
            categories: ['heritage'],
            formatted: 'Ukyo Ward, Kyoto',
            lat: 35.015,
            lon: 135.677,
          },
          geometry: { type: 'Point', coordinates: [135.677, 35.015] },
        },
      ];
      const existingDestinations = [
        { name: 'Arashiyama Bamboo Grove', latitude: 35.016, longitude: 135.671 },
      ];
      const result = filterAndMapNearbyPlaces(features, 35.01, 135.67, existingDestinations);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Tenryu-ji');
    });
  });

  describe('Trip Status Computation for Categories', () => {
    it('correctly categorizes planned, ongoing, and completed trips', () => {
      const ref = new Date('2026-10-15T00:00:00Z');
      expect(calculateTripStatus('2026-11-01', '2026-11-10', ref)).toBe('planned');
      expect(calculateTripStatus('2026-10-10', '2026-10-20', ref)).toBe('ongoing');
      expect(calculateTripStatus('2026-09-01', '2026-09-10', ref)).toBe('completed');
    });
  });
});
