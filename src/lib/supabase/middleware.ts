import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { TOTAL_EXPIRY_MS, INACTIVITY_COOKIE_NAME } from '@/lib/constants/auth';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project')
  );

  const pathname = request.nextUrl.pathname;

  // 4. Fail closed: When Supabase is not configured, redirect to error screen
  if (!isConfigured) {
    if (pathname === '/unconfigured') {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = '/unconfigured';
    return NextResponse.redirect(url);
  }

  // Allow public routes
  const publicPaths = [
    '/',
    '/login',
    '/manifest.json',
    '/auth/callback',
    '/reset-password',
    '/unconfigured',
    '/api/exchange-rates',
    '/api/places',
    '/api/photos',
    '/api/recommendations',
    '/api/weather',
    '/explore',
  ];
  const isPublicRoute = publicPaths.some(
    (path) => pathname === path || (path !== '/' && pathname.startsWith(path + '/'))
  );

  // Performance optimization: Fast-path for public API endpoints so they do not block on Supabase Auth roundtrips
  if (pathname.startsWith('/api/')) {
    return supabaseResponse;
  }


  try {
    const supabase = createServerClient(
      supabaseUrl!,
      supabaseKey!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: Array<{
              name: string;
              value: string;
              options?: Parameters<typeof supabaseResponse.cookies.set>[2];
            }>
          ) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    const createRedirect = (targetUrl: URL | string) => {
      const redirectResponse = NextResponse.redirect(targetUrl);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      return redirectResponse;
    };

    // Inactivity auto-logout verification (enforces timeout even if user closed the browser)
    if (user && !isPublicRoute) {
      const lastActiveCookie = request.cookies.get(INACTIVITY_COOKIE_NAME)?.value;
      if (lastActiveCookie) {
        const lastActive = parseInt(lastActiveCookie, 10);
        const elapsed = Date.now() - lastActive;
        if (!isNaN(lastActive) && elapsed >= TOTAL_EXPIRY_MS) {
          try {
            await supabase.auth.signOut();
          } catch {}

          const url = request.nextUrl.clone();
          url.pathname = '/login';
          url.searchParams.set('reason', 'idle');
          const redirectResponse = NextResponse.redirect(url);
          redirectResponse.cookies.delete(INACTIVITY_COOKIE_NAME);
          supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
          });
          return redirectResponse;
        }
      }

      // Refresh activity cookie
      supabaseResponse.cookies.set(INACTIVITY_COOKIE_NAME, String(Date.now()), {
        path: '/',
        sameSite: 'lax',
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60,
      });

      // Forward authenticated user ID to Server Components to eliminate duplicate getUser() queries
      request.headers.set('x-user-id', user.id);
      supabaseResponse = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
    }

    // Check for network or connection failure reaching Supabase
    if (userError && !userError.message.toLowerCase().includes('auth session missing')) {
      if (
        userError.message.includes('fetch') ||
        userError.message.includes('ECONNREFUSED') ||
        userError.status === 500
      ) {
        if (pathname !== '/unconfigured') {
          const url = request.nextUrl.clone();
          url.pathname = '/unconfigured';
          url.searchParams.set('error', 'unreachable');
          return createRedirect(url);
        }
      }
    }

    // Launch behavior for root `/`:
    if (pathname === '/') {
      if (user) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return createRedirect(url);
      }
      return supabaseResponse;
    }

    // Redirect unauthenticated users from protected routes to /login
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return createRedirect(url);
    }

    // Redirect authenticated users away from /login or /reset-password to /dashboard
    if (user && (pathname === '/login' || pathname === '/reset-password')) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return createRedirect(url);
    }

    // Admin role check on the server
    if (user && pathname.startsWith('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        url.searchParams.set('error', 'admin_required');
        return createRedirect(url);
      }
    }

    // 5. No cached private pages after logout
    if (user || !isPublicRoute) {
      supabaseResponse.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      supabaseResponse.headers.set('Pragma', 'no-cache');
      supabaseResponse.headers.set('Expires', '0');
    }
  } catch (err) {
    console.error('Supabase middleware session error:', err);
    if (!isPublicRoute && pathname !== '/unconfigured') {
      const url = request.nextUrl.clone();
      url.pathname = '/unconfigured';
      url.searchParams.set('error', 'unreachable');
      const errRedirect = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        errRedirect.cookies.set(cookie.name, cookie.value, cookie);
      });
      return errRedirect;
    }
  }

  return supabaseResponse;
}
