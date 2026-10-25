import { describe, it, expect } from 'vitest';
import {
  searchCuratedLocations,
  locationToSuggestion,
  locationToPlaceItem,
  CURATED_LOCATIONS,
} from '@/lib/location-data';

describe('Curated Location Data & Search', () => {
  it('contains comprehensive global and local destinations', () => {
    expect(CURATED_LOCATIONS.length).toBeGreaterThanOrEqual(30);

    const countries = new Set(CURATED_LOCATIONS.map((loc) => loc.country));
    expect(countries.has('Philippines')).toBe(true);
    expect(countries.has('Japan')).toBe(true);
    expect(countries.has('France')).toBe(true);
    expect(countries.has('Italy')).toBe(true);
    expect(countries.has('United Kingdom')).toBe(true);
  });

  it('searches Philippine destinations accurately by name and keyword', () => {
    const boracay = searchCuratedLocations('boracay');
    expect(boracay.length).toBeGreaterThan(0);
    expect(boracay[0].name).toContain('Boracay');
    expect(boracay[0].country).toBe('Philippines');

    const elNido = searchCuratedLocations('el nido');
    expect(elNido.length).toBeGreaterThan(0);
    expect(elNido[0].name).toBe('El Nido');

    const batanes = searchCuratedLocations('batanes');
    expect(batanes.length).toBeGreaterThan(0);
    expect(batanes[0].name).toContain('Batanes');
  });

  it('searches international destinations accurately', () => {
    const tokyo = searchCuratedLocations('tokyo');
    expect(tokyo.length).toBeGreaterThan(0);
    expect(tokyo[0].name).toBe('Tokyo');
    expect(tokyo[0].country).toBe('Japan');

    const kyoto = searchCuratedLocations('kyoto');
    expect(kyoto.length).toBeGreaterThan(0);
    expect(kyoto[0].name).toBe('Kyoto');

    const paris = searchCuratedLocations('paris');
    expect(paris.length).toBeGreaterThan(0);
    expect(paris[0].name).toBe('Paris');
    expect(paris[0].country).toBe('France');
  });

  it('converts to PlaceSuggestion and PlaceItem with valid schema fields', () => {
    const loc = CURATED_LOCATIONS[0];
    const suggestion = locationToSuggestion(loc);
    expect(suggestion.id).toBe(loc.id);
    expect(suggestion.name).toBe(loc.name);
    expect(suggestion.latitude).toBe(loc.latitude);
    expect(suggestion.longitude).toBe(loc.longitude);

    const placeItem = locationToPlaceItem(loc);
    expect(placeItem.id).toBe(loc.id);
    expect(placeItem.name).toBe(loc.name);
    expect(placeItem.category).toBe(loc.category);
    expect(placeItem.categoryLabel).toBe(loc.categoryLabel);
  });

  it('returns empty array for single character or blank queries', () => {
    expect(searchCuratedLocations('')).toEqual([]);
    expect(searchCuratedLocations('a')).toEqual([]);
    expect(searchCuratedLocations('   ')).toEqual([]);
  });
});
