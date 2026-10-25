import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  placesQuerySchema,
  mapOsmCategory,
  PlaceItem,
} from '@/lib/validators/places';
import { searchCuratedLocations, locationToPlaceItem } from '@/lib/location-data';

// In-memory cache for search results (TTL: 1 hour)
interface CachedSearchResult {
  timestamp: number;
  data: PlaceItem[];
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const placesCache = new Map<string, CachedSearchResult>();

// Rate limiter state: enforce no more than 1 request per second to Nominatim
let lastNominatimRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1000;

async function throttleNominatim(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastNominatimRequestTime;
  if (timeSinceLast < MIN_REQUEST_INTERVAL_MS) {
    const delay = MIN_REQUEST_INTERVAL_MS - timeSinceLast;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastNominatimRequestTime = Date.now();
}

interface NominatimRawItem {
  place_id: number;
  osm_id?: number;
  osm_type?: string;
  lat: string;
  lon: string;
  class: string;
  type: string;
  name?: string;
  display_name: string;
  address?: {
    country?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    tourism?: string;
    amenity?: string;
    historic?: string;
    natural?: string;
    attraction?: string;
    [key: string]: string | undefined;
  };
}

export async function GET(request: NextRequest) {
  // 1. Verify user authentication (strictly enforced in production)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if ((authError || !user) && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Authentication required to search places' },
        { status: 401 }
      );
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Failed to verify session' },
        { status: 401 }
      );
    }
  }

  // 2. Validate query parameter
  const searchParams = request.nextUrl.searchParams;
  const rawQ = searchParams.get('q') || '';

  const parsed = placesQuerySchema.safeParse({ q: rawQ });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || 'Invalid query';
    return NextResponse.json({ error: issue }, { status: 400 });
  }

  const query = parsed.data.q;
  const cacheKey = query.toLowerCase();

  // 3. Check in-memory cache
  const cached = placesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      places: cached.data,
      cached: true,
    });
  }

  // Search curated locations first for immediate, high-accuracy matches
  const curatedMatches: PlaceItem[] = searchCuratedLocations(query, 5).map(locationToPlaceItem);

  // 4. Build User-Agent adhering to Nominatim usage policy
  const appName = process.env.NOMINATIM_APP_NAME || 'TravelMate/1.0';
  const contactEmail = process.env.NOMINATIM_CONTACT_EMAIL || 'admin@travelmate.app';
  const userAgent = `${appName} (${contactEmail})`;

  try {
    // Enforce 1 req/sec rate limit
    await throttleNominatim();

    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
    nominatimUrl.searchParams.set('q', query);
    nominatimUrl.searchParams.set('format', 'jsonv2');
    nominatimUrl.searchParams.set('addressdetails', '1');
    nominatimUrl.searchParams.set('limit', '25'); // Expanded limit for richer results

    const res = await fetch(nominatimUrl.toString(), {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
    });

    if (res.status === 429) {
      if (curatedMatches.length > 0) {
        return NextResponse.json({
          places: curatedMatches,
          cached: false,
        });
      }
      return NextResponse.json(
        { error: 'Place search rate limit reached. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (!res.ok) {
      if (curatedMatches.length > 0) {
        return NextResponse.json({
          places: curatedMatches,
          cached: false,
        });
      }
      return NextResponse.json(
        { error: `Upstream place service returned status ${res.status}` },
        { status: 502 }
      );
    }

    const rawData: NominatimRawItem[] = await res.json();

    if (!Array.isArray(rawData)) {
      return NextResponse.json({ places: curatedMatches });
    }

    // 5. Trim and normalize results
    const trimmedPlaces: PlaceItem[] = rawData.map((item) => {
      const { category, categoryLabel } = mapOsmCategory(item.class, item.type);
      const name =
        item.name ||
        item.address?.tourism ||
        item.address?.amenity ||
        item.address?.historic ||
        item.address?.attraction ||
        item.address?.natural ||
        item.address?.city ||
        item.address?.town ||
        item.display_name.split(',')[0].trim();

      return {
        id: item.place_id.toString(),
        name,
        displayName: item.display_name,
        country: item.address?.country || '',
        category,
        categoryLabel,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: item.type || '',
        class: item.class || '',
      };
    });

    // Merge curated and Nominatim places, avoiding duplicates
    const combinedPlaces: PlaceItem[] = [...curatedMatches];
    const seenNames = new Set(curatedMatches.map((p) => p.name.toLowerCase()));

    for (const p of trimmedPlaces) {
      if (!seenNames.has(p.name.toLowerCase())) {
        seenNames.add(p.name.toLowerCase());
        combinedPlaces.push(p);
      }
    }

    // Save to cache
    placesCache.set(cacheKey, {
      timestamp: Date.now(),
      data: combinedPlaces,
    });

    return NextResponse.json({
      places: combinedPlaces,
      cached: false,
    });
  } catch (err: any) {
    if (curatedMatches.length > 0) {
      return NextResponse.json({
        places: curatedMatches,
        cached: false,
      });
    }

    console.error('Nominatim fetch error:', err);
    return NextResponse.json(
      { error: 'Unable to reach place search service. Please check your connection and try again.' },
      { status: 502 }
    );
  }
}
