import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  nearbyQuerySchema,
  filterAndMapNearbyPlaces,
  GeoapifyPlacesResponse,
  NearbySpotItem,
  calculateDistanceMeters,
} from '@/lib/validators/nearby';
import { CURATED_LOCATIONS } from '@/lib/location-data';

// 1. In-memory cache for nearby spots (TTL: 24 hours)
interface CachedNearbyResult {
  timestamp: number;
  data: NearbySpotItem[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const nearbyCache = new Map<string, CachedNearbyResult>();

// 2. Per-user rate limiter: max 15 requests per 30 seconds
const RATE_LIMIT_WINDOW_MS = 30 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const userRequestTimestamps = new Map<string, number[]>();

function checkRateLimit(userKey: string): boolean {
  const now = Date.now();
  const timestamps = (userRequestTimestamps.get(userKey) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  timestamps.push(now);
  userRequestTimestamps.set(userKey, timestamps);
  return true;
}

function getCuratedNearbySpots(
  lat: number,
  lon: number,
  radiusMeters: number,
  existingDestinations: Array<{ name: string; latitude?: number; longitude?: number }>
): NearbySpotItem[] {
  const existingLower = new Set(existingDestinations.map((d) => d.name.toLowerCase()));

  const spotsWithDistance = CURATED_LOCATIONS.map((loc) => {
    const dist = calculateDistanceMeters(lat, lon, loc.latitude, loc.longitude);
    return { loc, dist };
  })
    .filter(({ loc, dist }) => {
      if (existingLower.has(loc.name.toLowerCase())) return false;
      return dist <= Math.max(radiusMeters * 2, 80000) && dist > 100;
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 10);

  return spotsWithDistance.map(({ loc, dist }) => ({
    id: `curated-${loc.id}`,
    name: loc.name,
    category: loc.category === 'nature' ? 'park' : loc.category === 'culture' ? 'heritage' : 'tourism',
    categoryLabel: loc.categoryLabel,
    latitude: loc.latitude,
    longitude: loc.longitude,
    distanceMeters: Math.round(dist),
    address: loc.secondaryText,
    description: `Curated highlight in ${loc.country}`,
  }));
}

export async function GET(request: NextRequest) {
  // 1. Verify user authentication (signed-in only)
  let userIdentifier = 'anonymous';
  let userId: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if ((authError || !user) && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Authentication required for nearby tourist spots', spots: [] },
        { status: 401 }
      );
    }

    if (user?.id) {
      userId = user.id;
      userIdentifier = user.id;
    } else {
      userIdentifier =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'client-ip';
    }
  } catch {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Failed to verify session', spots: [] },
        { status: 401 }
      );
    }
  }

  // 2. Validate query parameters with Zod
  const searchParams = request.nextUrl.searchParams;
  const rawParams = {
    lat: searchParams.get('lat'),
    lon: searchParams.get('lon'),
    radius: searchParams.get('radius') || '10000',
    tripId: searchParams.get('tripId') || undefined,
  };

  const parsed = nearbyQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || 'Invalid parameters';
    return NextResponse.json({ error: issue, spots: [] }, { status: 400 });
  }

  const { lat, lon, radius, tripId } = parsed.data;

  // 3. Cache key based on rounded coordinates (~1.1 km bucket) and radius
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}:${radius}:${tripId || 'none'}`;
  const cached = nearbyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      spots: cached.data,
      places: cached.data,
      cached: true,
    });
  }

  // 4. Rate limiting check
  if (!checkRateLimit(userIdentifier)) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please wait a few seconds before requesting more nearby spots.',
        errorType: 'rate_limit_exceeded',
        spots: [],
      },
      { status: 429 }
    );
  }

  // 5. Fetch existing destinations for the trip (if tripId is provided)
  const existingDestinations: Array<{ name: string; latitude?: number; longitude?: number }> = [];
  if (tripId) {
    try {
      const supabase = await createClient();
      const { data: tripDests } = await supabase
        .from('destinations')
        .select('name, latitude, longitude')
        .eq('trip_id', tripId);

      if (tripDests) {
        tripDests.forEach((d) => {
          existingDestinations.push({
            name: d.name,
            latitude: Number(d.latitude) || undefined,
            longitude: Number(d.longitude) || undefined,
          });
        });
      }
    } catch {
      // Non-blocking: continue without existing destinations exclusion
    }
  }

  // 6. Check Geoapify API key (Server-only)
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey || apiKey.trim().length === 0 || apiKey.includes('your-geoapify')) {
    const fallbackSpots = getCuratedNearbySpots(lat, lon, radius, existingDestinations);
    if (fallbackSpots.length > 0) {
      nearbyCache.set(cacheKey, {
        timestamp: Date.now(),
        data: fallbackSpots,
      });
      return NextResponse.json({
        spots: fallbackSpots,
        places: fallbackSpots,
        cached: false,
      });
    }

    return NextResponse.json({
      spots: [],
      error: 'Geoapify API key not configured',
      errorType: 'key_missing',
    });
  }

  // 7. Call upstream Geoapify Places API v2
  const categories = [
    'tourism.attraction',
    'tourism.sights',
    'entertainment.museum',
    'leisure.park',
    'heritage',
    'building.historic',
    'entertainment.culture',
  ].join(',');

  const url = new URL('https://api.geoapify.com/v2/places');
  url.searchParams.set('categories', categories);
  url.searchParams.set('filter', `circle:${lon},${lat},${radius}`);
  url.searchParams.set('bias', `proximity:${lon},${lat}`);
  url.searchParams.set('limit', '20');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('apiKey', apiKey.trim());

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const fallbackSpots = getCuratedNearbySpots(lat, lon, radius, existingDestinations);
      if (fallbackSpots.length > 0) {
        return NextResponse.json({
          spots: fallbackSpots,
          places: fallbackSpots,
          cached: false,
        });
      }

      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({
          spots: [],
          error: 'Geoapify credentials invalid or expired',
          errorType: 'invalid_key',
        });
      }
      if (res.status === 402 || res.status === 429) {
        return NextResponse.json({
          spots: [],
          error: 'Geoapify quota exceeded',
          errorType: 'quota_exceeded',
        });
      }
      return NextResponse.json({
        spots: [],
        error: `Upstream error: ${res.status}`,
        errorType: 'upstream_error',
      });
    }

    const data: GeoapifyPlacesResponse = await res.json();
    const spots = filterAndMapNearbyPlaces(
      data.features || [],
      lat,
      lon,
      existingDestinations
    );

    // Cache results for 24h
    nearbyCache.set(cacheKey, {
      timestamp: Date.now(),
      data: spots,
    });

    return NextResponse.json({
      spots,
      places: spots,
      cached: false,
    });
  } catch (err: unknown) {
    const fallbackSpots = getCuratedNearbySpots(lat, lon, radius, existingDestinations);
    if (fallbackSpots.length > 0) {
      return NextResponse.json({
        spots: fallbackSpots,
        places: fallbackSpots,
        cached: false,
      });
    }

    return NextResponse.json({
      spots: [],
      error: 'Failed to reach Places API',
      errorType: 'network_error',
    });
  }
}
