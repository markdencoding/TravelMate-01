import { NextRequest, NextResponse } from 'next/server';
import {
  RecommendationItem,
  WikidataBinding,
  parseWikidataRecommendations,
} from '@/lib/recommendations';

export const revalidate = 604800; // Cache 7 days on Next.js server

interface WikidataResponse {
  results?: {
    bindings?: WikidataBinding[];
  };
}

// In-memory cache fallback (TTL 7 days)
const inMemoryCache = new Map<string, { timestamp: number; data: RecommendationItem[] }>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const country = (searchParams.get('country') || '').trim();

  if (!country || country.length < 2) {
    return NextResponse.json({ recommendations: [] });
  }

  const cacheKey = country.toLowerCase();
  const cached = inMemoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ recommendations: cached.data });
  }

  // Capitalize properly for Wikidata english label match (e.g., "japan" -> "Japan")
  const sanitizedCountry = country.charAt(0).toUpperCase() + country.slice(1);

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
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

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
      console.warn(`Wikidata query failed with status ${res.status}`);
      return NextResponse.json({ recommendations: [] });
    }

    const data: WikidataResponse = await res.json();
    const bindings = data.results?.bindings || [];

    const recommendations = parseWikidataRecommendations(bindings, sanitizedCountry);

    inMemoryCache.set(cacheKey, {
      timestamp: Date.now(),
      data: recommendations,
    });

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.warn('Failed to query Wikidata country recommendations:', err);
    // Silent fallback to empty array
    return NextResponse.json({ recommendations: [] });
  }
}
