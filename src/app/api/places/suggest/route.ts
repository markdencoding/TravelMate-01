import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  suggestQuerySchema,
  filterAndMapGeoapifySuggestions,
  GeoapifyAutocompleteResponse,
  PlaceSuggestion,
} from '@/lib/validators/suggestions';

// 1. In-memory cache for suggestions (TTL: 60 seconds)
interface CachedSuggestResult {
  timestamp: number;
  data: PlaceSuggestion[];
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const suggestCache = new Map<string, CachedSuggestResult>();

// 2. Per-user rate limiter: max 8 requests per 10 seconds
const RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10s
const MAX_REQUESTS_PER_WINDOW = 8;
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
  // 1. Verify user authentication (signed-in users only)
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

  // 5. Check Geoapify API Key configuration
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey || apiKey.trim().length === 0 || apiKey.includes('your-geoapify')) {
    return NextResponse.json({
      suggestions: [],
      error: 'Suggestions unavailable. Press Enter to search',
      errorType: 'key_missing',
    });
  }

  // 6. Call upstream Geoapify Address Autocomplete API
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  url.searchParams.set('text', query);
  url.searchParams.set('limit', '10');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('bias', 'countrycode:ph');
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
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({
          suggestions: [],
          error: 'Suggestions unavailable. Press Enter to search',
          errorType: 'invalid_key',
        });
      }
      if (res.status === 402 || res.status === 429) {
        return NextResponse.json({
          suggestions: [],
          error: 'Suggestions unavailable. Press Enter to search',
          errorType: 'quota_exceeded',
        });
      }
      return NextResponse.json({
        suggestions: [],
        error: 'Suggestions unavailable. Press Enter to search',
        errorType: 'upstream_error',
      });
    }

    const data: GeoapifyAutocompleteResponse = await res.json();
    const suggestions = filterAndMapGeoapifySuggestions(data.features || []);

    // Cache successful results
    suggestCache.set(cacheKey, {
      timestamp: Date.now(),
      data: suggestions,
    });

    return NextResponse.json({
      suggestions,
      cached: false,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      suggestions: [],
      error: 'Suggestions unavailable. Press Enter to search',
      errorType: 'upstream_error',
    });
  }
}
