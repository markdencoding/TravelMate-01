import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  suggestQuerySchema,
  filterAndMapGeoapifySuggestions,
  GeoapifyAutocompleteResponse,
  PlaceSuggestion,
} from '@/lib/validators/suggestions';
import { searchCuratedLocations, locationToSuggestion } from '@/lib/location-data';

// 1. In-memory cache for suggestions (TTL: 60 seconds)
interface CachedSuggestResult {
  timestamp: number;
  data: PlaceSuggestion[];
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const suggestCache = new Map<string, CachedSuggestResult>();

// 2. Per-user rate limiter: max 12 requests per 10 seconds
const RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10s
const MAX_REQUESTS_PER_WINDOW = 12;
const userRequestTimestamps = new Map<string, number[]>();

function checkRateLimit(userIdOrIp: string): boolean {
  const now = Date.now();
  const timestamps = (userRequestTimestamps.get(userIdOrIp) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }

  timestamps.push(now);
  userRequestTimestamps.set(userIdOrIp, timestamps);
  return true;
}

export async function GET(request: NextRequest) {
  // 1. Verify user authentication (signed-in users only in production)
  let userIdentifier = 'anonymous';
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if ((authError || !user) && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Authentication required for autocomplete suggestions' },
        { status: 401 }
      );
    }

    if (user?.id) {
      userIdentifier = user.id;
    } else {
      userIdentifier =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'client-ip';
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Failed to verify session' },
        { status: 401 }
      );
    }
  }

  // 2. Validate query parameter with Zod
  const searchParams = request.nextUrl.searchParams;
  const rawQ = searchParams.get('q') || '';

  const parsed = suggestQuerySchema.safeParse({ q: rawQ });
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || 'Invalid query';
    return NextResponse.json({ error: issue, suggestions: [] }, { status: 400 });
  }

  const query = parsed.data.q;
  const cacheKey = query.toLowerCase();

  // 3. Check in-memory cache
  const cached = suggestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      suggestions: cached.data,
      cached: true,
    });
  }

  // 4. Check per-user rate limit
  if (!checkRateLimit(userIdentifier)) {
    return NextResponse.json(
      {
        error: 'Too many suggestion requests. Press Enter to search directly.',
        errorType: 'rate_limit_exceeded',
        suggestions: [],
      },
      { status: 429 }
    );
  }

  // 5. Gather Curated High-Accuracy Location Matches
  const curatedMatches = searchCuratedLocations(query, 8).map(locationToSuggestion);

  // 6. Check Geoapify API Key configuration
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey || apiKey.trim().length === 0 || apiKey.includes('your-geoapify')) {
    // Return curated results if available, else informative notice
    if (curatedMatches.length > 0) {
      suggestCache.set(cacheKey, {
        timestamp: Date.now(),
        data: curatedMatches,
      });
      return NextResponse.json({
        suggestions: curatedMatches,
        cached: false,
      });
    }

    return NextResponse.json({
      suggestions: [],
      error: 'Press Enter to search all OpenStreetMap places worldwide',
      errorType: 'key_missing',
    });
  }

  // 7. Call upstream Geoapify Address Autocomplete API (global + multi-language)
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  url.searchParams.set('text', query);
  url.searchParams.set('limit', '10');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('apiKey', apiKey.trim());

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // Fallback to curated matches if upstream failed
      if (curatedMatches.length > 0) {
        return NextResponse.json({
          suggestions: curatedMatches,
          cached: false,
        });
      }

      return NextResponse.json({
        suggestions: [],
        error: 'Press Enter to search all OpenStreetMap destinations',
        errorType: 'upstream_error',
      });
    }

    const data: GeoapifyAutocompleteResponse = await res.json();
    const geoapifySuggestions = filterAndMapGeoapifySuggestions(data.features || []);

    // Merge curated and Geoapify suggestions, deduplicating by name & country
    const merged: PlaceSuggestion[] = [...curatedMatches];
    const seen = new Set(curatedMatches.map((c) => `${c.name.toLowerCase()}|${c.country.toLowerCase()}`));

    for (const g of geoapifySuggestions) {
      const key = `${g.name.toLowerCase()}|${g.country.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(g);
      }
      if (merged.length >= 10) break;
    }

    // Cache successful results
    suggestCache.set(cacheKey, {
      timestamp: Date.now(),
      data: merged,
    });

    return NextResponse.json({
      suggestions: merged,
      cached: false,
    });
  } catch (err: unknown) {
    if (curatedMatches.length > 0) {
      return NextResponse.json({
        suggestions: curatedMatches,
        cached: false,
      });
    }

    return NextResponse.json({
      suggestions: [],
      error: 'Press Enter to search all OpenStreetMap destinations',
      errorType: 'upstream_error',
    });
  }
}
