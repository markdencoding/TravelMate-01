import { describe, it, expect } from 'vitest';
import { placesQuerySchema, mapOsmCategory } from '@/lib/validators/places';

describe('Places Validator and Mappers', () => {
  describe('placesQuerySchema', () => {
    it('accepts valid queries between 2 and 100 characters', () => {
      const valid = placesQuerySchema.safeParse({ q: 'Kyoto' });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.q).toBe('Kyoto');
      }
    });

    it('trims leading and trailing whitespace', () => {
      const res = placesQuerySchema.safeParse({ q: '  Tokyo Tower  ' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.q).toBe('Tokyo Tower');
      }
    });

    it('rejects empty query and queries shorter than 2 characters', () => {
      expect(placesQuerySchema.safeParse({ q: '' }).success).toBe(false);
      expect(placesQuerySchema.safeParse({ q: 'a' }).success).toBe(false);
    });

    it('rejects queries longer than 100 characters', () => {
      const longQuery = 'a'.repeat(101);
      expect(placesQuerySchema.safeParse({ q: longQuery }).success).toBe(false);
    });
  });

  describe('mapOsmCategory', () => {
    it('correctly maps tourism/attractions', () => {
      const res = mapOsmCategory('tourism', 'attraction');
      expect(res.category).toBe('attractions');
      expect(res.categoryLabel).toBe('ATTRACTIONS');
    });

    it('correctly maps food and restaurants', () => {
      const res = mapOsmCategory('amenity', 'restaurant');
      expect(res.category).toBe('food');
      expect(res.categoryLabel).toBe('FOOD & DINING');
    });

    it('correctly maps natural and parks', () => {
      const res = mapOsmCategory('leisure', 'park');
      expect(res.category).toBe('nature');
      expect(res.categoryLabel).toBe('NATURE');
    });

    it('correctly maps historic shrines and temples', () => {
      const res = mapOsmCategory('historic', 'temple');
      expect(res.category).toBe('culture');
      expect(res.categoryLabel).toBe('CULTURE & HERITAGE');
    });

    it('falls back to landmark for unspecified categories', () => {
      const res = mapOsmCategory('unknown', 'unknown');
      expect(res.category).toBe('landmark');
      expect(res.categoryLabel).toBe('LANDMARK');
    });
  });
});
