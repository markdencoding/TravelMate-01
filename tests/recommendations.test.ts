import { describe, it, expect } from 'vitest';
import {
  getTravelerRecommendations,
  parseWikidataRecommendations,
  resolveCountryCurrency,
  TRAVELER_RECOMMENDED_DESTINATIONS,
  WikidataBinding,
} from '@/lib/recommendations';
import { travelerRecommendationsQuerySchema } from '@/lib/validators/recommendations';

describe('parseWikidataRecommendations', () => {
  it('correctly maps valid bindings, parsing coordinates and sitelinks', () => {
    const bindings: WikidataBinding[] = [
      {
        place: { value: 'http://www.wikidata.org/entity/Q1490' },
        placeLabel: { value: 'Tokyo' },
        coords: { value: 'Point(139.6917 35.6895)' },
        sitelinks: { value: '250' },
      },
      {
        place: { value: 'http://www.wikidata.org/entity/Q34600' },
        placeLabel: { value: 'Kyoto' },
        coords: { value: 'Point(135.7681 35.0116)' },
        sitelinks: { value: '180' },
      },
    ];

    const results = parseWikidataRecommendations(bindings, 'Japan');

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      id: 'Q1490',
      name: 'Tokyo',
      country: 'Japan',
      latitude: 35.6895,
      longitude: 139.6917,
      sitelinks: 250,
    });
    expect(results[1]).toEqual({
      id: 'Q34600',
      name: 'Kyoto',
      country: 'Japan',
      latitude: 35.0116,
      longitude: 135.7681,
      sitelinks: 180,
    });
  });

  it('filters out raw Q-code fallback labels and missing labels', () => {
    const bindings: WikidataBinding[] = [
      {
        place: { value: 'http://www.wikidata.org/entity/Q99999' },
        placeLabel: { value: 'Q99999' },
        coords: { value: 'Point(135.0 35.0)' },
        sitelinks: { value: '20' },
      },
      {
        place: { value: 'http://www.wikidata.org/entity/Q88888' },
        placeLabel: { value: '   ' },
        coords: { value: 'Point(135.0 35.0)' },
      },
      {
        place: { value: 'http://www.wikidata.org/entity/Q1234' },
        placeLabel: { value: 'Mount Fuji' },
        coords: { value: 'Point(138.7275 35.3606)' },
        sitelinks: { value: '110' },
      },
    ];

    const results = parseWikidataRecommendations(bindings, 'Japan');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Mount Fuji');
  });

  it('deduplicates places by case-insensitive name', () => {
    const bindings: WikidataBinding[] = [
      {
        place: { value: 'http://www.wikidata.org/entity/Q1490' },
        placeLabel: { value: 'Tokyo' },
        coords: { value: 'Point(139.6917 35.6895)' },
        sitelinks: { value: '250' },
      },
      {
        place: { value: 'http://www.wikidata.org/entity/Q9999' },
        placeLabel: { value: 'tokyo' },
        coords: { value: 'Point(139.7 35.7)' },
        sitelinks: { value: '50' },
      },
    ];

    const results = parseWikidataRecommendations(bindings, 'Japan');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('Q1490');
  });

  it('handles malformed or missing coordinates gracefully', () => {
    const bindings: WikidataBinding[] = [
      {
        place: { value: 'http://www.wikidata.org/entity/Q5555' },
        placeLabel: { value: 'Scenic Park' },
        coords: { value: 'InvalidFormat' },
        sitelinks: { value: '10' },
      },
    ];

    const results = parseWikidataRecommendations(bindings, 'Japan');
    expect(results).toHaveLength(1);
    expect(results[0].latitude).toBe(0);
    expect(results[0].longitude).toBe(0);
  });

  it('returns empty array when bindings are empty', () => {
    expect(parseWikidataRecommendations([], 'Japan')).toEqual([]);
  });
});

describe('travelerRecommendationsQuerySchema', () => {
  it('applies defaults when optional parameters are omitted', () => {
    const parsed = travelerRecommendationsQuerySchema.parse({});
    expect(parsed).toEqual({ country: 'all', category: 'all' });
  });

  it('validates supported country and category filters', () => {
    const parsed = travelerRecommendationsQuerySchema.safeParse({
      country: 'Philippines',
      category: 'nature',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({ country: 'Philippines', category: 'nature' });
    }
  });

  it('rejects unsupported category values', () => {
    const parsed = travelerRecommendationsQuerySchema.safeParse({
      country: 'Japan',
      category: 'shopping',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('getTravelerRecommendations', () => {
  it('returns featured destinations by default with valid coordinates and clean copy', () => {
    const featured = getTravelerRecommendations();
    expect(featured).toHaveLength(5);
    expect(featured[0].id).toBe('ph-siargao');
    for (const item of featured) {
      expect(item.featured).toBe(true);
      expect(item.latitude).not.toBe(0);
      expect(item.longitude).not.toBe(0);
      expect(item.highlights.length).toBeGreaterThan(0);
    }

    for (const item of TRAVELER_RECOMMENDED_DESTINATIONS) {
      expect(item.summary.includes('\u2014')).toBe(false);
      expect(item.clothingTip.includes('\u2014')).toBe(false);
    }
  });

  it('filters recommendations by travel category', () => {
    const foodPicks = getTravelerRecommendations({ country: 'all', category: 'food' });
    expect(foodPicks.length).toBeGreaterThanOrEqual(2);
    expect(foodPicks.every((d) => d.category === 'food')).toBe(true);
  });

  it('filters recommendations by country and supplements from curated locations', () => {
    const phPicks = getTravelerRecommendations({ country: 'Philippines', category: 'all' });
    expect(phPicks.length).toBeGreaterThanOrEqual(4);
    expect(phPicks.every((d) => d.country === 'Philippines')).toBe(true);
    expect(phPicks.every((d) => d.currency === 'PHP')).toBe(true);
  });

  it('appends non-duplicate Wikidata items with valid coordinates for country queries', () => {
    const jpPicks = getTravelerRecommendations({
      country: 'Japan',
      category: 'attractions',
      extraWikidataItems: [
        {
          id: 'Q1490',
          name: 'Tokyo',
          country: 'Japan',
          latitude: 35.6762,
          longitude: 139.6503,
          sitelinks: 250,
        },
        {
          id: 'Q77777',
          name: 'Kanazawa',
          country: 'Japan',
          latitude: 36.5613,
          longitude: 136.6562,
          sitelinks: 95,
        },
        {
          id: 'Q00000',
          name: 'Zero Coord Place',
          country: 'Japan',
          latitude: 0,
          longitude: 0,
          sitelinks: 40,
        },
      ],
    });

    expect(jpPicks.some((d) => d.name === 'Kanazawa')).toBe(true);
    expect(jpPicks.some((d) => d.name === 'Zero Coord Place')).toBe(false);
    const tokyoMatches = jpPicks.filter((d) => d.name.toLowerCase() === 'tokyo');
    expect(tokyoMatches).toHaveLength(1);
  });

  it('returns an empty array when a country and category combination has no matches', () => {
    const none = getTravelerRecommendations({ country: 'Thailand', category: 'food' });
    expect(none).toEqual([]);
  });

  it('maps country currencies accurately', () => {
    expect(resolveCountryCurrency('Philippines')).toBe('PHP');
    expect(resolveCountryCurrency('Japan')).toBe('JPY');
    expect(resolveCountryCurrency('Italy')).toBe('EUR');
    expect(resolveCountryCurrency('Unknown Country')).toBe('USD');
  });
});
