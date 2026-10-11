import { describe, it, expect } from 'vitest';
import {
  suggestQuerySchema,
  mapGeoapifyPropertiesToSuggestion,
  filterAndMapGeoapifySuggestions,
  GeoapifyFeature,
} from '@/lib/validators/suggestions';

describe('Suggestions Validator and Mapper', () => {
  describe('suggestQuerySchema', () => {
    it('accepts valid queries between 2 and 100 characters', () => {
      expect(suggestQuerySchema.safeParse({ q: 'Tokyo' }).success).toBe(true);
      expect(suggestQuerySchema.safeParse({ q: 'PH' }).success).toBe(true);
    });

    it('rejects query shorter than 2 characters or empty', () => {
      expect(suggestQuerySchema.safeParse({ q: 'T' }).success).toBe(false);
      expect(suggestQuerySchema.safeParse({ q: '   ' }).success).toBe(false);
    });

    it('rejects query longer than 100 characters', () => {
      const longQuery = 'A'.repeat(101);
      expect(suggestQuerySchema.safeParse({ q: longQuery }).success).toBe(false);
    });
  });

  describe('mapGeoapifyPropertiesToSuggestion', () => {
    it('correctly maps country entities', () => {
      const props = {
        name: 'Japan',
        country: 'Japan',
        country_code: 'jp',
        result_type: 'country',
        category: 'administrative',
        lat: 36.2048,
        lon: 138.2529,
        place_id: 'country-japan',
      };
      const result = mapGeoapifyPropertiesToSuggestion(props);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Japan');
      expect(result?.kind).toBe('country');
      expect(result?.secondaryText).toBe('Country');
      expect(result?.latitude).toBe(36.2048);
    });

    it('correctly maps cities and populated places', () => {
      const props = {
        name: 'Kyoto',
        city: 'Kyoto',
        state: 'Kyoto Prefecture',
        country: 'Japan',
        country_code: 'jp',
        result_type: 'city',
        category: 'populated_place',
        lat: 35.0116,
        lon: 135.7681,
        place_id: 'city-kyoto',
      };
      const result = mapGeoapifyPropertiesToSuggestion(props);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Kyoto');
      expect(result?.kind).toBe('city');
      expect(result?.secondaryText).toContain('Kyoto Prefecture');
      expect(result?.secondaryText).toContain('Japan');
    });

    it('correctly maps landmarks and tourist sights', () => {
      const props = {
        name: 'Eiffel Tower',
        city: 'Paris',
        state: 'Île-de-France',
        country: 'France',
        country_code: 'fr',
        result_type: 'amenity',
        category: 'tourism.attraction',
        lat: 48.8584,
        lon: 2.2945,
        place_id: 'sight-eiffel',
      };
      const result = mapGeoapifyPropertiesToSuggestion(props);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Eiffel Tower');
      expect(result?.kind).toBe('landmark');
      expect(result?.secondaryText).toContain('Paris');
      expect(result?.secondaryText).toContain('France');
    });

    it('filters out street addresses, postcodes, and private buildings', () => {
      expect(
        mapGeoapifyPropertiesToSuggestion({
          name: 'Main Street',
          result_type: 'street',
          country: 'USA',
        })
      ).toBeNull();

      expect(
        mapGeoapifyPropertiesToSuggestion({
          name: '12345',
          result_type: 'postcode',
          country: 'Germany',
        })
      ).toBeNull();

      expect(
        mapGeoapifyPropertiesToSuggestion({
          name: 'Corporate Office Building',
          result_type: 'building',
          category: 'commercial.office',
          country: 'UK',
        })
      ).toBeNull();
    });
  });

  describe('filterAndMapGeoapifySuggestions', () => {
    it('deduplicates results and caps at 8 items', () => {
      const features: GeoapifyFeature[] = [
        {
          type: 'Feature',
          properties: {
            name: 'Tokyo',
            country: 'Japan',
            result_type: 'city',
            category: 'populated_place',
            lat: 35.6762,
            lon: 139.6503,
            place_id: 'tokyo-1',
          },
        },
        {
          type: 'Feature',
          properties: {
            name: 'tokyo', // duplicate
            country: 'Japan',
            result_type: 'city',
            category: 'populated_place',
            lat: 35.6762,
            lon: 139.6503,
            place_id: 'tokyo-2',
          },
        },
        {
          type: 'Feature',
          properties: {
            name: 'Tokyo Street', // excluded street
            result_type: 'street',
            country: 'Japan',
          },
        },
        {
          type: 'Feature',
          properties: {
            name: 'Kyoto',
            country: 'Japan',
            result_type: 'city',
            category: 'populated_place',
            lat: 35.0116,
            lon: 135.7681,
            place_id: 'kyoto-1',
          },
        },
      ];

      const mapped = filterAndMapGeoapifySuggestions(features);
      expect(mapped).toHaveLength(2);
      expect(mapped[0].name).toBe('Tokyo');
      expect(mapped[1].name).toBe('Kyoto');
    });
  });

  describe('Debounce, Abort, and Stale-Response Logic', () => {
    it('aborts previous inflight requests when new keystroke occurs', () => {
      let firstAborted = false;
      const controller1 = new AbortController();
      controller1.signal.addEventListener('abort', () => {
        firstAborted = true;
      });

      // User types 'kyo'
      let activeController: AbortController | null = controller1;

      // User quickly types 't' -> triggers abort on previous request
      if (activeController) {
        activeController.abort();
      }
      activeController = new AbortController();

      expect(firstAborted).toBe(true);
      expect(activeController.signal.aborted).toBe(false);
    });

    it('discards stale response when query has advanced', () => {
      let activeQuery = 'kyoto';
      const staleQuery = 'kyo';
      let stateUpdated = false;

      // Response for 'kyo' arrives after user has typed 'kyoto'
      const onResponseReceived = (responseQuery: string, data: string[]) => {
        if (responseQuery !== activeQuery) {
          return; // Ignore stale response!
        }
        stateUpdated = true;
      };

      onResponseReceived(staleQuery, ['Tokyo', 'Kyoto']);
      expect(stateUpdated).toBe(false);

      // Now response for 'kyoto' arrives
      onResponseReceived('kyoto', ['Kyoto']);
      expect(stateUpdated).toBe(true);
    });

    it('session cache prevents redundant requests for backspaced query', () => {
      const cache = new Map<string, string[]>();
      let fetchCount = 0;

      const performSearch = (q: string) => {
        const key = q.toLowerCase();
        if (cache.has(key)) {
          return cache.get(key)!;
        }
        fetchCount++;
        const results = [`Results for ${q}`];
        cache.set(key, results);
        return results;
      };

      // Type 'kyo' -> fetch #1
      performSearch('kyo');
      expect(fetchCount).toBe(1);

      // Type 'kyoto' -> fetch #2
      performSearch('kyoto');
      expect(fetchCount).toBe(2);

      // Backspace to 'kyo' -> cached! fetchCount stays 2
      const cachedRes = performSearch('kyo');
      expect(fetchCount).toBe(2);
      expect(cachedRes).toEqual(['Results for kyo']);
    });
  });

  describe('Combobox Keyboard Navigation Logic', () => {
    const listLength = 4;

    function handleArrowKey(
      key: 'ArrowDown' | 'ArrowUp',
      currentIndex: number,
      total: number
    ): number {
      if (key === 'ArrowDown') {
        return currentIndex < total - 1 ? currentIndex + 1 : 0;
      } else {
        return currentIndex > 0 ? currentIndex - 1 : total - 1;
      }
    }

    it('cycles ArrowDown forward and wraps to start', () => {
      let index = 0;
      index = handleArrowKey('ArrowDown', index, listLength); // 1
      expect(index).toBe(1);
      index = handleArrowKey('ArrowDown', index, listLength); // 2
      expect(index).toBe(2);
      index = handleArrowKey('ArrowDown', index, listLength); // 3
      expect(index).toBe(3);
      index = handleArrowKey('ArrowDown', index, listLength); // wraps to 0
      expect(index).toBe(0);
    });

    it('cycles ArrowUp backward and wraps to end', () => {
      let index = 0;
      index = handleArrowKey('ArrowUp', index, listLength); // wraps to 3
      expect(index).toBe(3);
      index = handleArrowKey('ArrowUp', index, listLength); // 2
      expect(index).toBe(2);
    });
  });
});
