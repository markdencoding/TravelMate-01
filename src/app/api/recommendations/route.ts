import { NextRequest, NextResponse } from 'next/server';
import {
  RecommendationItem,
  WikidataBinding,
  getTravelerRecommendations,
  parseWikidataRecommendations,
} from '@/lib/recommendations';
import { CURATED_LOCATIONS } from '@/lib/location-data';
import { travelerRecommendationsQuerySchema } from '@/lib/validators/recommendations';

export const revalidate = 604800; // Cache 7 days on Next.js server

interface WikidataResponse {
  results?: {
    bindings?: WikidataBinding[];
  };
}

// In-memory cache fallback (TTL 7 days)
const inMemoryCache = new Map<string, { timestamp: number; data: RecommendationItem[] }>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function toTitleCaseCountry(country: string): string {
  return country
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

async function fetchCountryWikidataRecommendations(
  country: string,
  timeoutMs: number
): Promise<RecommendationItem[]> {
  const cacheKey = country.trim().toLowerCase();
  const cached = inMemoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const sanitizedCountry = toTitleCaseCountry(country);

  const sparqlQuery = `
SELECT DISTINCT ?place ?placeLabel ?coords ?sitelinks WHERE {
  ?country rdfs:label "${sanitizedCountry.replace(/"/g, '\\"')}"@en;
           wdt:P31 wd:Q6256.
  {
    ?place wdt:P31 wd:Q515;
           wdt:P17 ?country;
           wdt:P625 ?coords;
           wikibase:sitelinks ?sitelinks.
    FILTER(?sitelinks > 15)
  } UNION {
    ?place wdt:P31 wd:Q570116;
           wdt:P17 ?country;
           wdt:P625 ?coords;
           wikibase:sitelinks ?sitelinks.
    FILTER(?sitelinks > 8)
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 12
`.trim();

  const appName = process.env.NOMINATIM_APP_NAME || 'TravelMate/1.0';
  const contactEmail = process.env.NOMINATIM_CONTACT_EMAIL || 'admin@travelmate.app';
  const userAgent = `${appName} (${contactEmail})`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const sparqlUrl = new URL('https://query.wikidata.org/sparql');
    sparqlUrl.searchParams.set('query', sparqlQuery);
    sparqlUrl.searchParams.set('format', 'json');

    const res = await fetch(sparqlUrl.toString(), {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/sparql-results+json',
      },
      signal: controller.signal,
      next: { revalidate: 604800 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return getCuratedCountryRecommendations(sanitizedCountry);
    }

    const data: WikidataResponse = await res.json();
    const bindings = data.results?.bindings || [];
    let recommendations = parseWikidataRecommendations(bindings, sanitizedCountry);

    if (recommendations.length === 0) {
      recommendations = getCuratedCountryRecommendations(sanitizedCountry);
    }

    inMemoryCache.set(cacheKey, {
      timestamp: Date.now(),
      data: recommendations,
    });

    return recommendations;
  } catch {
    return getCuratedCountryRecommendations(sanitizedCountry);
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = (searchParams.get('mode') || '').trim().toLowerCase();

  if (mode === 'travelers') {
    const parsed = travelerRecommendationsQuerySchema.safeParse({
      country: searchParams.get('country') ?? 'all',
      category: searchParams.get('category') ?? 'all',
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid filter parameters.';
      return NextResponse.json({ error: message, destinations: [] }, { status: 400 });
    }

    const { country, category } = parsed.data;
    const isAllCountries = !country || country.toLowerCase() === 'all';
    const extraWikidataItems = isAllCountries
      ? []
      : await fetchCountryWikidataRecommendations(country, 6000);

    const destinations = getTravelerRecommendations({
      country,
      category,
      extraWikidataItems,
    });

    return NextResponse.json(
      { destinations },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  }

  const country = (searchParams.get('country') || '').trim();
  if (!country || country.length < 2) {
    return NextResponse.json({ recommendations: [] });
  }

  const recommendations = await fetchCountryWikidataRecommendations(country, 12000);
  return NextResponse.json({ recommendations });
}

function getCuratedCountryRecommendations(countryName: string): RecommendationItem[] {
  const cLower = countryName.toLowerCase();
  return CURATED_LOCATIONS.filter(
    (loc) => loc.country.toLowerCase() === cLower || loc.country.toLowerCase().includes(cLower)
  ).map((loc, idx) => ({
    id: loc.id,
    name: loc.name,
    country: loc.country,
    latitude: loc.latitude,
    longitude: loc.longitude,
    sitelinks: 100 - idx,
  }));
}
