import { describe, it, expect } from 'vitest';
import {
  parseWikidataRecommendations,
  WikidataBinding,
} from '@/lib/recommendations';

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
        placeLabel: { value: 'Q99999' }, // Unlabelled item fallback in Wikidata
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
