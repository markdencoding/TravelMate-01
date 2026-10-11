import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  photoQuerySchema,
  stripHtml,
  isFreeLicense,
  isExcludedNonPhoto,
  PhotoSuggestion,
  PhotosApiResponse,
} from '@/lib/validators/photos';

// 1. In-memory cache for photos (TTL: 24 hours)
interface CachedPhotosResult {
  timestamp: number;
  data: PhotoSuggestion[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const photosCache = new Map<string, CachedPhotosResult>();

// 2. Per-user sliding-window rate limiter: max 10 requests per 10 seconds
const RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10s
const MAX_REQUESTS_PER_WINDOW = 10;
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
      return NextResponse.json<PhotosApiResponse>(
        {
          success: false,
          data: [],
          total: 0,
          error: {
            code: 'unauthorized',
            message: 'You must be signed in to search destination cover photos.',
          },
        },
        { status: 401 }
      );
    }

    if (user?.id) {
      userIdentifier = user.id;
    } else {
      const forwarded = request.headers.get('x-forwarded-for');
      userIdentifier = forwarded ? forwarded.split(',')[0].trim() : 'dev-user';
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json<PhotosApiResponse>(
        {
          success: false,
          data: [],
          total: 0,
          error: {
            code: 'unauthorized',
            message: 'Session validation failed.',
          },
        },
        { status: 401 }
      );
    }
  }

  // 2. Check rate limit
  if (!checkRateLimit(userIdentifier)) {
    return NextResponse.json<PhotosApiResponse>(
      {
        success: false,
        data: [],
        total: 0,
        error: {
          code: 'rate_limit_exceeded',
          message: 'Too many photo search requests. Please wait a moment.',
        },
      },
      { status: 429 }
    );
  }

  // 3. Parse and validate input
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('query') || '';
  const rawCountry = searchParams.get('country') || '';

  const parsed = photoQuerySchema.safeParse({ query: rawQuery, country: rawCountry });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid search parameters';
    return NextResponse.json<PhotosApiResponse>(
      {
        success: false,
        data: [],
        total: 0,
        error: {
          code: 'invalid_query',
          message: firstError,
        },
      },
      { status: 400 }
    );
  }

  const { query, country } = parsed.data;
  const cacheKey = `${query.toLowerCase()}|${country.toLowerCase()}`;

  // 4. Return cached response if valid
  const cached = photosCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json<PhotosApiResponse>(
      {
        success: true,
        data: cached.data,
        total: cached.data.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
      }
    );
  }

  // 5. Build standard identifying User-Agent
  const appName = process.env.NOMINATIM_APP_NAME || 'TravelMate/1.0';
  const contactEmail = process.env.NOMINATIM_CONTACT_EMAIL || 'contact@travelmate.app';
  const userAgent = `${appName} (${contactEmail})`;

  try {
    const candidateFileTitles: string[] = [];

    // Step A: Search for destination Wikipedia article
    const searchTerm = country ? `${query} ${country}` : query;
    const wikiSearchUrl = new URL('https://en.wikipedia.org/w/api.php');
    wikiSearchUrl.searchParams.set('action', 'query');
    wikiSearchUrl.searchParams.set('list', 'search');
    wikiSearchUrl.searchParams.set('srsearch', searchTerm);
    wikiSearchUrl.searchParams.set('srlimit', '5');
    wikiSearchUrl.searchParams.set('format', 'json');

    const wikiSearchRes = await fetch(wikiSearchUrl.toString(), {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(8000),
    });

    if (wikiSearchRes.ok) {
      const wikiSearchData = await wikiSearchRes.json();
      const searchResults: Array<{ title: string; snippet?: string }> =
        wikiSearchData?.query?.search || [];

      // Pick the best non-disambiguation article
      const bestArticle = searchResults.find(
        (item) => !item.title.toLowerCase().includes('(disambiguation)')
      );

      if (bestArticle) {
        // Fetch images in this article
        const imagesUrl = new URL('https://en.wikipedia.org/w/api.php');
        imagesUrl.searchParams.set('action', 'query');
        imagesUrl.searchParams.set('titles', bestArticle.title);
        imagesUrl.searchParams.set('prop', 'images');
        imagesUrl.searchParams.set('imlimit', '30');
        imagesUrl.searchParams.set('format', 'json');

        const imagesRes = await fetch(imagesUrl.toString(), {
          headers: { 'User-Agent': userAgent },
          signal: AbortSignal.timeout(8000),
        });

        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          const pages = imagesData?.query?.pages || {};
          for (const pageId of Object.keys(pages)) {
            const pageImages: Array<{ title: string }> = pages[pageId]?.images || [];
            for (const img of pageImages) {
              if (
                img.title &&
                !candidateFileTitles.includes(img.title) &&
                !isExcludedNonPhoto(img.title)
              ) {
                candidateFileTitles.push(img.title);
              }
            }
          }
        }
      }
    }

    // Step B: If fewer than 5 candidate images found, query Wikimedia Commons search
    if (candidateFileTitles.length < 5) {
      const commonsSearchUrl = new URL('https://commons.wikimedia.org/w/api.php');
      commonsSearchUrl.searchParams.set('action', 'query');
      commonsSearchUrl.searchParams.set('generator', 'search');
      commonsSearchUrl.searchParams.set('gsrsearch', `${searchTerm} landscape travel`);
      commonsSearchUrl.searchParams.set('gsrnamespace', '6'); // File namespace
      commonsSearchUrl.searchParams.set('gsrlimit', '15');
      commonsSearchUrl.searchParams.set('format', 'json');

      const commonsRes = await fetch(commonsSearchUrl.toString(), {
        headers: { 'User-Agent': userAgent },
        signal: AbortSignal.timeout(8000),
      });

      if (commonsRes.ok) {
        const commonsData = await commonsRes.json();
        const pages = commonsData?.query?.pages || {};
        for (const pageId of Object.keys(pages)) {
          const title = pages[pageId]?.title;
          if (
            title &&
            !candidateFileTitles.includes(title) &&
            !isExcludedNonPhoto(title)
          ) {
            candidateFileTitles.push(title);
          }
        }
      }
    }

    if (candidateFileTitles.length === 0) {
      return NextResponse.json<PhotosApiResponse>({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Step C: Fetch imageinfo in batches from Wikimedia Commons
    // Limit to up to 20 candidate files to respect API bandwidth
    const titlesToQuery = candidateFileTitles.slice(0, 20);
    const infoUrl = new URL('https://commons.wikimedia.org/w/api.php');
    infoUrl.searchParams.set('action', 'query');
    infoUrl.searchParams.set('titles', titlesToQuery.join('|'));
    infoUrl.searchParams.set('prop', 'imageinfo');
    infoUrl.searchParams.set('iiprop', 'url|size|extmetadata|mime');
    infoUrl.searchParams.set('iiurlwidth', '800'); // Standard 800px thumbnail
    infoUrl.searchParams.set('format', 'json');

    const infoRes = await fetch(infoUrl.toString(), {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(10000),
    });

    if (!infoRes.ok) {
      throw new Error(`Wikimedia Commons responded with status ${infoRes.status}`);
    }

    const infoData = await infoRes.json();
    const infoPages = infoData?.query?.pages || {};
    const photoResults: PhotoSuggestion[] = [];

    for (const key of Object.keys(infoPages)) {
      const page = infoPages[key];
      const title = page?.title || '';
      const ii = page?.imageinfo?.[0];
      if (!ii) continue;

      const mime = (ii.mime || '').toLowerCase();
      // Only JPEG or PNG
      if (mime !== 'image/jpeg' && mime !== 'image/png') continue;

      const width = Number(ii.width || 0);
      const height = Number(ii.height || 0);

      // Width at least 1000px and landscape orientation (aspect ratio >= 1.3)
      if (width < 1000 || height <= 0 || width / height < 1.3) continue;

      const metadata = ii.extmetadata || {};
      const description = stripHtml(metadata.ImageDescription?.value || '');
      const objectName = stripHtml(metadata.ObjectName?.value || '');

      // Content keyword filter
      if (isExcludedNonPhoto(title, description)) continue;

      // License check
      const licenseShort = stripHtml(
        metadata.LicenseShortName?.value || metadata.License?.value || ''
      );
      if (!isFreeLicense(licenseShort)) continue;

      // Creator / Artist check
      const artist = stripHtml(metadata.Artist?.value || metadata.Credit?.value || '');
      const creator = artist || 'Wikimedia contributor';

      const licenseUrl =
        metadata.LicenseUrl?.value ||
        (licenseShort.toLowerCase().includes('cc by-sa 4.0')
          ? 'https://creativecommons.org/licenses/by-sa/4.0'
          : licenseShort.toLowerCase().includes('cc by 4.0')
          ? 'https://creativecommons.org/licenses/by/4.0'
          : '');

      const filePageUrl =
        ii.descriptionurl ||
        `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

      const altText =
        objectName ||
        (description.length > 5 && description.length < 120
          ? description
          : `${query} landmark landscape`);

      photoResults.push({
        id: `wiki-${page.pageid || title}`,
        thumbUrl: ii.thumburl || ii.url,
        coverUrl: ii.url,
        alt: altText,
        creator,
        licenseName: licenseShort || 'CC BY-SA',
        licenseUrl,
        filePageUrl,
      });

      if (photoResults.length >= 8) break;
    }

    // Save to server cache
    photosCache.set(cacheKey, {
      timestamp: Date.now(),
      data: photoResults,
    });

    return NextResponse.json<PhotosApiResponse>(
      {
        success: true,
        data: photoResults,
        total: photoResults.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
      }
    );
  } catch (err: any) {
    console.error('Wikimedia photos API error:', err);
    return NextResponse.json<PhotosApiResponse>(
      {
        success: false,
        data: [],
        total: 0,
        error: {
          code: 'provider_down',
          message: 'Photo suggestions are temporarily unavailable from Wikimedia.',
        },
      },
      { status: 502 }
    );
  }
}
