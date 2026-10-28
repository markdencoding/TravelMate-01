import { CURATED_LOCATIONS, type LocationRecord } from './location-data';
import type { PlaceCategory } from './validators/places';
import type { RecommendationCategoryFilter } from './validators/recommendations';

export interface WikidataBinding {
  place?: { value: string };
  placeLabel?: { value: string };
  coords?: { value: string };
  sitelinks?: { value: string };
}

export interface RecommendationItem {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  sitelinks: number;
}

export interface RecommendedSpot {
  id: string;
  name: string;
  categoryLabel?: string;
  category?: string;
  distanceMeters?: number;
  latitude: number;
  longitude: number;
}

export interface TravelerDestinationRecommendation {
  id: string;
  name: string;
  region: string;
  country: string;
  currency: string;
  category: PlaceCategory;
  categoryLabel: string;
  latitude: number;
  longitude: number;
  summary: string;
  highlights: string[];
  clothingTip: string;
  spots: RecommendedSpot[];
  featured?: boolean;
  sitelinks?: number;
}

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  philippines: 'PHP',
  japan: 'JPY',
  'south korea': 'KRW',
  thailand: 'THB',
  indonesia: 'IDR',
  singapore: 'SGD',
  taiwan: 'TWD',
  'hong kong': 'HKD',
  malaysia: 'MYR',
  vietnam: 'VND',
  australia: 'AUD',
  france: 'EUR',
  italy: 'EUR',
  'united kingdom': 'GBP',
  spain: 'EUR',
  netherlands: 'EUR',
  iceland: 'EUR',
  'united states': 'USD',
  canada: 'CAD',
  chile: 'CLP',
  peru: 'PEN',
};

const CATEGORY_DISPLAY_LABELS: Record<PlaceCategory, string> = {
  nature: 'Nature',
  culture: 'Culture & Heritage',
  food: 'Food & Dining',
  attractions: 'Attractions',
  landmark: 'Landmark',
};

export const TRAVELER_RECOMMENDED_DESTINATIONS: TravelerDestinationRecommendation[] = [
  {
    id: 'ph-siargao',
    name: 'Siargao Island',
    region: 'Surigao del Norte, Caraga',
    country: 'Philippines',
    currency: 'PHP',
    category: 'nature',
    categoryLabel: 'Nature',
    latitude: 9.8562,
    longitude: 126.0463,
    summary:
      'Reef breaks along General Luna, palm-lined coastal roads, tidal limestone rock pools, and mangrove lagoons across Del Carmen.',
    highlights: ['Cloud 9 Boardwalk', 'Sugba Lagoon', 'Magpupungko Rock Pools'],
    clothingTip:
      'Rash guard, reef-safe sunscreen, water shoes for tidal limestone rocks, and light cotton layers.',
    featured: true,
    spots: [
      {
        id: 'spot-srg-1',
        name: 'Cloud 9 Boardwalk',
        categoryLabel: 'Surf Break',
        latitude: 9.8136,
        longitude: 126.1653,
        distanceMeters: 4800,
      },
      {
        id: 'spot-srg-2',
        name: 'Sugba Lagoon',
        categoryLabel: 'Lagoon',
        latitude: 9.9272,
        longitude: 125.9522,
        distanceMeters: 16200,
      },
      {
        id: 'spot-srg-3',
        name: 'Magpupungko Rock Pools',
        categoryLabel: 'Tidal Pools',
        latitude: 9.8741,
        longitude: 126.1158,
        distanceMeters: 9400,
      },
    ],
  },
  {
    id: 'jp-osaka',
    name: 'Osaka',
    region: 'Kansai Region',
    country: 'Japan',
    currency: 'JPY',
    category: 'food',
    categoryLabel: 'Food & Dining',
    latitude: 34.6937,
    longitude: 135.5023,
    summary:
      'Canal-side street food stalls, historic castle grounds, covered market arcades, and direct rail links across Kansai.',
    highlights: ['Dotonbori Canal', 'Kuromon Ichiba Market', 'Osaka Castle Park'],
    clothingTip:
      'Supportive walking shoes for station transfers and a light windproof layer for evening canal walks.',
    featured: true,
    spots: [
      {
        id: 'spot-osa-1',
        name: 'Dotonbori',
        categoryLabel: 'Food District',
        latitude: 34.6687,
        longitude: 135.5013,
        distanceMeters: 2800,
      },
      {
        id: 'spot-osa-2',
        name: 'Kuromon Ichiba Market',
        categoryLabel: 'Public Market',
        latitude: 34.6654,
        longitude: 135.5065,
        distanceMeters: 3100,
      },
      {
        id: 'spot-osa-3',
        name: 'Osaka Castle',
        categoryLabel: 'Historic Castle',
        latitude: 34.6873,
        longitude: 135.5262,
        distanceMeters: 2400,
      },
    ],
  },
  {
    id: 'ph-vigan',
    name: 'Vigan City',
    region: 'Ilocos Sur, Ilocos Region',
    country: 'Philippines',
    currency: 'PHP',
    category: 'culture',
    categoryLabel: 'Culture & Heritage',
    latitude: 17.5747,
    longitude: 120.3869,
    summary:
      'Spanish-era cobblestone streets, ancestral stone-and-brick houses, clay jar workshops, and regional Ilocano kitchens.',
    highlights: ['Calle Crisologo', 'Bantay Bell Tower', 'Syquia Mansion'],
    clothingTip:
      'Breathable linen or cotton shirts, sun hat, and cushioned flats for cobblestone streets.',
    featured: true,
    spots: [
      {
        id: 'spot-vig-1',
        name: 'Calle Crisologo',
        categoryLabel: 'Heritage Street',
        latitude: 17.5718,
        longitude: 120.3888,
        distanceMeters: 600,
      },
      {
        id: 'spot-vig-2',
        name: 'Bantay Bell Tower',
        categoryLabel: 'Historic Watchtower',
        latitude: 17.5819,
        longitude: 120.3917,
        distanceMeters: 1800,
      },
      {
        id: 'spot-vig-3',
        name: 'Syquia Mansion Museum',
        categoryLabel: 'Museum',
        latitude: 17.5707,
        longitude: 120.3899,
        distanceMeters: 850,
      },
    ],
  },
  {
    id: 'kr-seoul',
    name: 'Seoul',
    region: 'Capital Region',
    country: 'South Korea',
    currency: 'KRW',
    category: 'attractions',
    categoryLabel: 'Attractions',
    latitude: 37.5665,
    longitude: 126.978,
    summary:
      'Joseon royal palaces framed by Bukhansan granite peaks, Bukchon hanok alleys, night markets, and Hangang river parks.',
    highlights: ['Gyeongbokgung Palace', 'Bukchon Hanok Village', 'N Seoul Tower'],
    clothingTip:
      'Layered casual wear, cushioned sneakers for subway stairs, and a mid-weight jacket in spring or autumn.',
    featured: true,
    spots: [
      {
        id: 'spot-sel-1',
        name: 'Gyeongbokgung Palace',
        categoryLabel: 'Royal Palace',
        latitude: 37.5796,
        longitude: 126.977,
        distanceMeters: 1600,
      },
      {
        id: 'spot-sel-2',
        name: 'Bukchon Hanok Village',
        categoryLabel: 'Heritage District',
        latitude: 37.5826,
        longitude: 126.983,
        distanceMeters: 2100,
      },
      {
        id: 'spot-sel-3',
        name: 'N Seoul Tower',
        categoryLabel: 'Observatory',
        latitude: 37.5512,
        longitude: 126.9882,
        distanceMeters: 1900,
      },
    ],
  },
  {
    id: 'it-rome',
    name: 'Rome',
    region: 'Lazio',
    country: 'Italy',
    currency: 'EUR',
    category: 'culture',
    categoryLabel: 'Culture & Heritage',
    latitude: 41.9028,
    longitude: 12.4964,
    summary:
      'Ancient Roman forums, Renaissance piazzas, neighborhood trattorias in Trastevere, and walkable historic quarters.',
    highlights: ['Colosseum & Forum', 'Pantheon', 'Trevi Fountain'],
    clothingTip:
      'Thick-soled walking shoes for cobblestones, a refillable bottle for public fountains, and shoulder cover for basilicas.',
    featured: true,
    spots: [
      {
        id: 'spot-rom-1',
        name: 'Colosseum',
        categoryLabel: 'Ancient Amphitheatre',
        latitude: 41.8902,
        longitude: 12.4922,
        distanceMeters: 1400,
      },
      {
        id: 'spot-rom-2',
        name: 'Pantheon',
        categoryLabel: 'Roman Monument',
        latitude: 41.8986,
        longitude: 12.4769,
        distanceMeters: 1700,
      },
      {
        id: 'spot-rom-3',
        name: 'Trevi Fountain',
        categoryLabel: 'Baroque Fountain',
        latitude: 41.9009,
        longitude: 12.4833,
        distanceMeters: 1100,
      },
    ],
  },
  {
    id: 'ph-bohol',
    name: 'Bohol',
    region: 'Tagbilaran & Panglao, Central Visayas',
    country: 'Philippines',
    currency: 'PHP',
    category: 'nature',
    categoryLabel: 'Nature',
    latitude: 9.85,
    longitude: 124.1435,
    summary:
      'Conical limestone hills in Carmen, tarsier forest sanctuaries in Corella, river cruises, and coral reefs off Panglao.',
    highlights: ['Chocolate Hills', 'Tarsier Sanctuary', 'Alona Beach'],
    clothingTip:
      'Light trekking shirts, a compact rain poncho, and snorkel footwear for Panglao island boat trips.',
    spots: [
      {
        id: 'spot-boh-1',
        name: 'Chocolate Hills Complex',
        categoryLabel: 'Geological Landmark',
        latitude: 9.7988,
        longitude: 124.1697,
        distanceMeters: 6500,
      },
      {
        id: 'spot-boh-2',
        name: 'Philippine Tarsier Sanctuary',
        categoryLabel: 'Wildlife Sanctuary',
        latitude: 9.6914,
        longitude: 123.9531,
        distanceMeters: 21000,
      },
      {
        id: 'spot-boh-3',
        name: 'Alona Beach, Panglao',
        categoryLabel: 'Beach',
        latitude: 9.5484,
        longitude: 123.7722,
        distanceMeters: 42000,
      },
    ],
  },
  {
    id: 'ph-baguio',
    name: 'Baguio City',
    region: 'Benguet, Cordillera',
    country: 'Philippines',
    currency: 'PHP',
    category: 'attractions',
    categoryLabel: 'Attractions',
    latitude: 16.4023,
    longitude: 120.596,
    summary:
      'Pine-lined mountain parks, Cordillera art museums, highland cafes, and cooler mountain weather above Luzon.',
    highlights: ['Burnham Park', 'BenCab Museum', 'Camp John Hay'],
    clothingTip:
      'Light fleece or cardigan for cool highland mornings, foldable umbrella, and walking sneakers.',
    spots: [
      {
        id: 'spot-bag-1',
        name: 'Burnham Park',
        categoryLabel: 'Urban Park',
        latitude: 16.4124,
        longitude: 120.5929,
        distanceMeters: 1200,
      },
      {
        id: 'spot-bag-2',
        name: 'BenCab Museum',
        categoryLabel: 'Art Museum',
        latitude: 16.3879,
        longitude: 120.5567,
        distanceMeters: 4600,
      },
      {
        id: 'spot-bag-3',
        name: 'Camp John Hay',
        categoryLabel: 'Highland Estate',
        latitude: 16.3972,
        longitude: 120.6122,
        distanceMeters: 2400,
      },
    ],
  },
  {
    id: 'jp-kyoto',
    name: 'Kyoto',
    region: 'Kansai Region',
    country: 'Japan',
    currency: 'JPY',
    category: 'culture',
    categoryLabel: 'Culture & Heritage',
    latitude: 35.0116,
    longitude: 135.7681,
    summary:
      'Cedar-shaded shrine paths, Zen stone gardens, wooden machiya lanes in Gion, and riverside walking routes.',
    highlights: ['Fushimi Inari Taisha', 'Arashiyama Bamboo Grove', 'Kinkaku-ji'],
    clothingTip:
      'Slip-on walking shoes with clean socks for temple interiors and layered outerwear for cool evenings.',
    spots: [
      {
        id: 'spot-kyo-1',
        name: 'Fushimi Inari Taisha',
        categoryLabel: 'Shinto Shrine',
        latitude: 34.9671,
        longitude: 135.7727,
        distanceMeters: 4800,
      },
      {
        id: 'spot-kyo-2',
        name: 'Arashiyama Bamboo Grove',
        categoryLabel: 'Forest Walk',
        latitude: 35.017,
        longitude: 135.6713,
        distanceMeters: 8900,
      },
      {
        id: 'spot-kyo-3',
        name: 'Kinkaku-ji',
        categoryLabel: 'Zen Temple',
        latitude: 35.0394,
        longitude: 135.7292,
        distanceMeters: 5200,
      },
    ],
  },
  {
    id: 'kr-jeju',
    name: 'Jeju Island',
    region: 'Jeju Province',
    country: 'South Korea',
    currency: 'KRW',
    category: 'nature',
    categoryLabel: 'Nature',
    latitude: 33.4996,
    longitude: 126.5312,
    summary:
      'Volcanic crater trails on Hallasan, basalt sea cliffs, tangerine orchards, and coastal Olle walking paths.',
    highlights: ['Seongsan Ilchulbong', 'Hallasan National Park', 'Jeongbang Waterfall'],
    clothingTip:
      'Windproof shell jacket, trail shoes for volcanic stone paths, and sun protection.',
    spots: [
      {
        id: 'spot-jej-1',
        name: 'Seongsan Ilchulbong',
        categoryLabel: 'Volcanic Tuff Cone',
        latitude: 33.4581,
        longitude: 126.9426,
        distanceMeters: 38000,
      },
      {
        id: 'spot-jej-2',
        name: 'Hallasan National Park',
        categoryLabel: 'Mountain Park',
        latitude: 33.3617,
        longitude: 126.5292,
        distanceMeters: 15000,
      },
      {
        id: 'spot-jej-3',
        name: 'Jeongbang Waterfall',
        categoryLabel: 'Coastal Waterfall',
        latitude: 33.2449,
        longitude: 126.5718,
        distanceMeters: 28000,
      },
    ],
  },
  {
    id: 'th-chiangmai',
    name: 'Chiang Mai',
    region: 'Northern Thailand',
    country: 'Thailand',
    currency: 'THB',
    category: 'culture',
    categoryLabel: 'Culture & Heritage',
    latitude: 18.7883,
    longitude: 98.9853,
    summary:
      'Moated Old City temples, Lanna craft markets, hillside coffee villages, and Doi Suthep mountain viewpoints.',
    highlights: ['Wat Phra That Doi Suthep', 'Wat Chedi Luang', 'Tha Phae Gate'],
    clothingTip:
      'Modest shoulder-and-knee cover for temple compounds, breathable cotton, and a light layer for mountain mornings.',
    spots: [
      {
        id: 'spot-cnx-1',
        name: 'Wat Phra That Doi Suthep',
        categoryLabel: 'Mountain Temple',
        latitude: 18.8049,
        longitude: 98.9215,
        distanceMeters: 7200,
      },
      {
        id: 'spot-cnx-2',
        name: 'Wat Chedi Luang',
        categoryLabel: 'Historic Temple',
        latitude: 18.787,
        longitude: 98.9866,
        distanceMeters: 400,
      },
      {
        id: 'spot-cnx-3',
        name: 'Tha Phae Gate',
        categoryLabel: 'City Gate',
        latitude: 18.7877,
        longitude: 98.9933,
        distanceMeters: 850,
      },
    ],
  },
  {
    id: 'tw-taipei',
    name: 'Taipei',
    region: 'Northern Taiwan',
    country: 'Taiwan',
    currency: 'TWD',
    category: 'food',
    categoryLabel: 'Food & Dining',
    latitude: 25.033,
    longitude: 121.5654,
    summary:
      'Night market street stalls, thermal hot springs in Beitou, Xiangshan skyline trails, and Maokong hillside tea houses.',
    highlights: ['Raohe Night Market', 'Taipei 101', 'Xiangshan Trail'],
    clothingTip:
      'Compact umbrella for passing showers, comfortable walking sneakers, and a light layer for transit.',
    spots: [
      {
        id: 'spot-tpe-1',
        name: 'Raohe Street Night Market',
        categoryLabel: 'Night Market',
        latitude: 25.0509,
        longitude: 121.5775,
        distanceMeters: 2600,
      },
      {
        id: 'spot-tpe-2',
        name: 'Taipei 101',
        categoryLabel: 'Skyscraper',
        latitude: 25.0339,
        longitude: 121.5645,
        distanceMeters: 400,
      },
      {
        id: 'spot-tpe-3',
        name: 'Xiangshan Hiking Trail',
        categoryLabel: 'Viewpoint Trail',
        latitude: 25.0273,
        longitude: 121.5707,
        distanceMeters: 1100,
      },
    ],
  },
];

export function resolveCountryCurrency(country: string): string {
  const normalized = country.trim().toLowerCase();
  return COUNTRY_CURRENCY_MAP[normalized] || 'USD';
}

function toTitleCasePhrase(text: string): string {
  return text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function mapLocationRecordToTravelerRecommendation(
  loc: LocationRecord
): TravelerDestinationRecommendation {
  const regionPart = loc.secondaryText
    .replace(new RegExp(`,?\\s*${loc.country}$`, 'i'), '')
    .trim();
  const region = regionPart || loc.country;
  const highlights = loc.keywords
    .filter(
      (kw) =>
        kw.toLowerCase() !== loc.name.toLowerCase() &&
        kw.toLowerCase() !== loc.country.toLowerCase()
    )
    .slice(0, 3)
    .map(toTitleCasePhrase);

  const categoryLabel = CATEGORY_DISPLAY_LABELS[loc.category] || 'Attractions';

  return {
    id: loc.id,
    name: loc.name,
    region,
    country: loc.country,
    currency: resolveCountryCurrency(loc.country),
    category: loc.category,
    categoryLabel,
    latitude: loc.latitude,
    longitude: loc.longitude,
    summary: `Notable ${categoryLabel.toLowerCase()} stop in ${region}, ${loc.country}${
      highlights.length > 0 ? `, known for ${highlights.join(', ')}` : ''
    }.`,
    highlights: highlights.length > 0 ? highlights : [region],
    clothingTip:
      'Comfortable walking footwear, weather-appropriate layers, and sun or rain protection for outdoor stops.',
    spots: [],
  };
}

/** Preserves the 5-card featured default while merging curated and Wikidata stops for active filters. */
export function getTravelerRecommendations(options?: {
  country?: string;
  category?: RecommendationCategoryFilter;
  extraWikidataItems?: RecommendationItem[];
}): TravelerDestinationRecommendation[] {
  const countryFilter = (options?.country || 'all').trim().toLowerCase();
  const categoryFilter: RecommendationCategoryFilter = options?.category || 'all';
  const isAllCountries = !countryFilter || countryFilter === 'all';

  if (isAllCountries && categoryFilter === 'all') {
    return TRAVELER_RECOMMENDED_DESTINATIONS.filter((item) => item.featured);
  }

  const results: TravelerDestinationRecommendation[] = [];
  const seenNames = new Set<string>();

  for (const dest of TRAVELER_RECOMMENDED_DESTINATIONS) {
    if (!isAllCountries && dest.country.toLowerCase() !== countryFilter) {
      continue;
    }
    if (categoryFilter !== 'all' && dest.category !== categoryFilter) {
      continue;
    }
    seenNames.add(dest.name.toLowerCase());
    results.push(dest);
  }

  // Cap combined curated and Wikidata enrichment at 9 items so grids stay balanced.
  for (const loc of CURATED_LOCATIONS) {
    if (results.length >= 9) break;
    if (!isAllCountries && loc.country.toLowerCase() !== countryFilter) {
      continue;
    }
    if (categoryFilter !== 'all' && loc.category !== categoryFilter) {
      continue;
    }
    if (seenNames.has(loc.name.toLowerCase())) {
      continue;
    }
    seenNames.add(loc.name.toLowerCase());
    results.push(mapLocationRecordToTravelerRecommendation(loc));
  }

  // Skip zero-coordinate Wikidata records so map previews never jump to Null Island.
  if (
    !isAllCountries &&
    options?.extraWikidataItems &&
    (categoryFilter === 'all' || categoryFilter === 'attractions')
  ) {
    for (const wiki of options.extraWikidataItems) {
      if (results.length >= 9) break;
      if (seenNames.has(wiki.name.toLowerCase())) continue;
      if (wiki.latitude === 0 && wiki.longitude === 0) continue;
      seenNames.add(wiki.name.toLowerCase());
      results.push({
        id: `wiki-${wiki.id}`,
        name: wiki.name,
        region: wiki.country,
        country: wiki.country,
        currency: resolveCountryCurrency(wiki.country),
        category: 'attractions',
        categoryLabel: 'Attractions',
        latitude: wiki.latitude,
        longitude: wiki.longitude,
        summary: `Publicly indexed landmark or city in ${wiki.country} from Wikidata open geographic records.`,
        highlights: [wiki.country, `${wiki.latitude.toFixed(2)}°, ${wiki.longitude.toFixed(2)}°`],
        clothingTip:
          'Check the 5-day Open-Meteo forecast below before packing layers and walking footwear.',
        spots: [],
        sitelinks: wiki.sitelinks,
      });
    }
  }

  return results;
}

/**
 * Parses raw Wikidata SPARQL bindings into clean RecommendationItem objects.
 * Handles deduplication, coordinate parsing (Point(lon lat)), and skips raw Q-codes.
 */
export function parseWikidataRecommendations(
  bindings: WikidataBinding[],
  country: string
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  const seenNames = new Set<string>();

  for (const b of bindings) {
    const name = b.placeLabel?.value?.trim();
    const coords = b.coords?.value?.trim() || '';
    const sitelinks = parseInt(b.sitelinks?.value || '0', 10);
    const uri = b.place?.value || '';
    const id = uri.split('/').pop() || name || Math.random().toString();

    if (!name || seenNames.has(name.toLowerCase()) || /^Q\d+$/.test(name)) {
      continue;
    }
    seenNames.add(name.toLowerCase());

    const match = coords.match(/Point\(([-\d.]+)\s+([-\d.]+)\)/);
    const lon = match ? parseFloat(match[1]) : 0;
    const lat = match ? parseFloat(match[2]) : 0;

    recommendations.push({
      id,
      name,
      country,
      latitude: lat,
      longitude: lon,
      sitelinks,
    });
  }

  return recommendations;
}
