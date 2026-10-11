import { z } from 'zod';

export const placesQuerySchema = z.object({
  q: z
    .string({ required_error: 'Search query is required' })
    .trim()
    .min(2, 'Query must be at least 2 characters')
    .max(100, 'Query must be 100 characters or fewer'),
});

export const placeCategoryEnum = z.enum([
  'attractions',
  'food',
  'nature',
  'culture',
  'landmark',
]);

export type PlaceCategory = z.infer<typeof placeCategoryEnum>;

export const placeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  country: z.string(),
  category: placeCategoryEnum,
  categoryLabel: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  type: z.string(),
  class: z.string(),
});

export type PlaceItem = z.infer<typeof placeItemSchema>;

export const placesResponseSchema = z.object({
  places: z.array(placeItemSchema),
});

export type PlacesResponse = z.infer<typeof placesResponseSchema>;

/**
 * Maps OpenStreetMap class and type to TravelMate UI categories
 */
export function mapOsmCategory(osmClass?: string, osmType?: string): {
  category: PlaceCategory;
  categoryLabel: string;
} {
  const cls = (osmClass || '').toLowerCase();
  const typ = (osmType || '').toLowerCase();

  // Food & Dining
  if (
    cls === 'amenity' &&
    ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'food_court', 'bistro', 'bakery'].includes(typ)
  ) {
    return { category: 'food', categoryLabel: 'FOOD & DINING' };
  }

  // Nature
  if (
    cls === 'natural' ||
    cls === 'leisure' && ['park', 'garden', 'nature_reserve'].includes(typ) ||
    ['peak', 'wood', 'beach', 'cliff', 'water', 'forest'].includes(typ)
  ) {
    return { category: 'nature', categoryLabel: 'NATURE' };
  }

  // Culture & Shrines
  if (
    cls === 'historic' ||
    (cls === 'amenity' && ['place_of_worship', 'arts_centre', 'theatre'].includes(typ)) ||
    ['temple', 'shrine', 'monument', 'memorial', 'castle', 'museum', 'ruins'].includes(typ)
  ) {
    return { category: 'culture', categoryLabel: 'CULTURE & HERITAGE' };
  }

  // Attractions / Tourism
  if (
    cls === 'tourism' ||
    ['attraction', 'viewpoint', 'theme_park', 'zoo', 'aquarium'].includes(typ)
  ) {
    return { category: 'attractions', categoryLabel: 'ATTRACTIONS' };
  }

  // Fallback
  return { category: 'landmark', categoryLabel: 'LANDMARK' };
}
