import { describe, it, expect } from 'vitest';
import { addDestinationSchema } from '@/lib/validators/destination';

describe('Destination Validator and Duplicate Logic', () => {
  describe('addDestinationSchema', () => {
    it('accepts valid destination input', () => {
      const valid = {
        tripId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Kiyomizu-dera Temple',
        country: 'Japan',
        latitude: 34.9948,
        longitude: 135.785,
      };
      const res = addDestinationSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('rejects invalid tripId (non-uuid)', () => {
      const invalid = {
        tripId: 'not-a-uuid',
        name: 'Kiyomizu-dera',
        country: 'Japan',
        latitude: 34.9948,
        longitude: 135.785,
      };
      expect(addDestinationSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects empty destination name', () => {
      const invalid = {
        tripId: '123e4567-e89b-12d3-a456-426614174000',
        name: '   ',
        country: 'Japan',
        latitude: 34.9948,
        longitude: 135.785,
      };
      expect(addDestinationSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('duplicate-destination detection logic', () => {
    const existing = [
      {
        id: 'dest-1',
        name: 'Fushimi Inari Taisha',
        latitude: 34.9671,
        longitude: 135.7727,
      },
      {
        id: 'dest-2',
        name: 'Kinkaku-ji',
        latitude: 35.0394,
        longitude: 135.7292,
      },
    ];

    function checkIsDuplicate(
      existingList: typeof existing,
      name: string,
      lat: number,
      lon: number
    ): boolean {
      return existingList.some((dest) => {
        const nameMatches = dest.name.trim().toLowerCase() === name.trim().toLowerCase();
        const coordsMatch =
          Math.abs(dest.latitude - lat) < 0.0005 &&
          Math.abs(dest.longitude - lon) < 0.0005;
        return nameMatches || coordsMatch;
      });
    }

    it('detects duplicate by exact or case-insensitive name', () => {
      expect(checkIsDuplicate(existing, 'fushimi inari taisha', 0, 0)).toBe(true);
      expect(checkIsDuplicate(existing, 'Fushimi Inari Taisha', 34.9671, 135.7727)).toBe(true);
    });

    it('detects duplicate by near-identical coordinates (< 50m)', () => {
      // Different name spelling but same physical coordinates
      expect(checkIsDuplicate(existing, 'Inari Mountain Shrine', 34.9672, 135.7728)).toBe(true);
    });

    it('allows distinct non-duplicate destinations', () => {
      expect(checkIsDuplicate(existing, 'Gion District', 35.0037, 135.7772)).toBe(false);
    });
  });
});
