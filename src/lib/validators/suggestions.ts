import { z } from 'zod';

export const suggestQuerySchema = z.object({
  q: z
    .string({ required_error: 'Query is required' })
    .trim()
    .min(2, 'Query must be at least 2 characters')
    .max(100, 'Query must be 100 characters or fewer'),
});

export const placeKindEnum = z.enum([
  'country',
  'region',
  'city',
  'place',
  'landmark',
]);

export type PlaceKind = z.infer<typeof placeKindEnum>;

export const placeSuggestionSchema = z.object({
  id: z.string(),
  name: z.string(),
  secondaryText: z.string(),
  country: z.string(),
  countryCode: z.string(),
  kind: placeKindEnum,
  latitude: z.number(),
  longitude: z.number(),
});

export type PlaceSuggestion = z.infer<typeof placeSuggestionSchema>;

export interface GeoapifyFeatureProperties {
  place_id?: string;
  name?: string;
  formatted?: string;
  country?: string;
  country_code?: string;
  state?: string;
  region?: string;
  county?: string;
  city?: string;
  village?: string;
  suburb?: string;
  hamlet?: string;
  result_type?: string;
  category?: string;
  lat?: number;
  lon?: number;
  address_line1?: string;
  address_line2?: string;
  [key: string]: unknown;
}

export interface GeoapifyFeature {
  type: string;
  properties: GeoapifyFeatureProperties;
}

export interface GeoapifyAutocompleteResponse {
  type: string;
  features: GeoapifyFeature[];
}

/**
 * Maps raw Geoapify properties to PlaceSuggestion.
 * Filters out street addresses, individual buildings, postcodes, and commercial/industrial sites.
 */
export function mapGeoapifyPropertiesToSuggestion(
  props: GeoapifyFeatureProperties
): PlaceSuggestion | null {
  const resultType = (props.result_type || '').toLowerCase();
  const category = (props.category || '').toLowerCase();

  // 1. Explicit exclusions: street addresses, individual buildings, postcodes
  if (
    resultType === 'street' ||
    resultType === 'building' ||
    resultType === 'postcode'
  ) {
    return null;
  }

  // Exclude non-travel categories
  if (
    category.startsWith('commercial.office') ||
    category.startsWith('residential') ||
    category.startsWith('highway') ||
    category.startsWith('service')
  ) {
    return null;
  }

  // 2. Determine Primary Name
  const name = (
    props.name ||
    props.city ||
    props.state ||
    props.country ||
    props.address_line1 ||
    (props.formatted ? props.formatted.split(',')[0] : '')
  ).trim();

  if (!name || name.length < 1) {
    return null;
  }

  // 3. Determine Kind (country | region | city | place | landmark)
  let kind: PlaceKind = 'place';
  if (resultType === 'country') {
    kind = 'country';
  } else if (
    resultType === 'state' ||
    (category === 'administrative' && (props.state || props.region))
  ) {
    kind = 'region';
  } else if (
    resultType === 'city' ||
    resultType === 'locality' ||
    category === 'populated_place'
  ) {
    kind = 'city';
  } else if (
    resultType === 'amenity' ||
    category.startsWith('tourism') ||
    category.startsWith('natural') ||
    category.startsWith('leisure') ||
    category.startsWith('heritage') ||
    category.startsWith('entertainment')
  ) {
    kind = 'landmark';
  }

  // 4. Determine Secondary Text (Region and Country)
  const country = (props.country || '').trim();
  const countryCode = (props.country_code || '').toLowerCase().trim();
  const stateOrRegion = (props.state || props.region || props.county || '').trim();
  const city = (props.city || props.village || props.suburb || '').trim();

  let secondaryText = '';
  if (kind === 'country') {
    secondaryText = 'Country';
  } else if (kind === 'region') {
    secondaryText = country;
  } else if (kind === 'city') {
    const parts = [];
    if (stateOrRegion && stateOrRegion !== name) parts.push(stateOrRegion);
    if (country) parts.push(country);
    secondaryText = parts.join(', ');
  } else {
    // Landmark or place
    const parts = [];
    if (city && city !== name) parts.push(city);
    else if (stateOrRegion && stateOrRegion !== name) parts.push(stateOrRegion);
    if (country) parts.push(country);
    secondaryText = parts.join(', ');
  }

  if (!secondaryText && props.formatted) {
    // Fallback: strip name from formatted address
    const stripped = props.formatted.replace(new RegExp(`^${name},?\\s*`, 'i'), '').trim();
    secondaryText = stripped || country;
  }

  const lat = typeof props.lat === 'number' ? props.lat : 0;
  const lon = typeof props.lon === 'number' ? props.lon : 0;
  const id = props.place_id || `${name}-${lat}-${lon}`;

  return {
    id,
    name,
    secondaryText,
    country,
    countryCode,
    kind,
    latitude: lat,
    longitude: lon,
  };
}

/**
 * Deduplicates and maps features list to PlaceSuggestion[]
 */
export function filterAndMapGeoapifySuggestions(
  features: GeoapifyFeature[]
): PlaceSuggestion[] {
  const suggestions: PlaceSuggestion[] = [];
  const seenKeys = new Set<string>();

  for (const feat of features) {
    if (!feat || !feat.properties) continue;
    const item = mapGeoapifyPropertiesToSuggestion(feat.properties);
    if (!item) continue;

    const dedupeKey = `${item.name.toLowerCase()}|${item.country.toLowerCase()}|${item.kind}`;
    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);

    suggestions.push(item);
    if (suggestions.length >= 8) break;
  }

  return suggestions;
}
