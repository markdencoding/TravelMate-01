import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  weatherQuerySchema,
  mapWmoCode,
  TrimmedWeatherResponse,
  WeatherDayForecast,
} from '@/lib/validators/weather';
import https from 'node:https';

function fetchOpenMeteoJson(url: string, userAgent: string): Promise<{ ok: boolean; status: number; data?: any }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': userAgent,
          Accept: 'application/json',
        },
        timeout: 30000,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          const status = res.statusCode || 200;
          if (status < 200 || status >= 300) {
            resolve({ ok: false, status });
            return;
          }
          try {
            const data = JSON.parse(raw);
            resolve({ ok: true, status, data });
          } catch (e) {
            reject(new Error('Failed to parse weather JSON'));
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('Open-Meteo connection timed out'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

// In-memory cache for weather results (TTL: 30 minutes)
interface CachedWeather {
  timestamp: number;
  data: TrimmedWeatherResponse;
}

const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const weatherCache = new Map<string, CachedWeather>();

export async function GET(request: NextRequest) {
  // 1. Validate coordinates (supports lat/latitude and lon/longitude)
  const searchParams = request.nextUrl.searchParams;
  const latParam = searchParams.get('lat') || searchParams.get('latitude');
  const lonParam = searchParams.get('lon') || searchParams.get('longitude');

  const parsed = weatherQuerySchema.safeParse({
    lat: latParam,
    lon: lonParam,
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message || 'Invalid coordinates';
    return NextResponse.json({ error: issue }, { status: 400 });
  }

  const { lat, lon } = parsed.data;
  // Round to 3 decimal places (~100m) for caching efficiency
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;

  // 3. Check in-memory cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return NextResponse.json({
      ...cached.data,
      cached: true,
    });
  }

  try {
    const openMeteoUrl = new URL('https://api.open-meteo.com/v1/forecast');
    openMeteoUrl.searchParams.set('latitude', lat.toString());
    openMeteoUrl.searchParams.set('longitude', lon.toString());
    openMeteoUrl.searchParams.set(
      'current',
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m'
    );
    openMeteoUrl.searchParams.set(
      'daily',
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset'
    );
    openMeteoUrl.searchParams.set('timezone', 'auto');
    openMeteoUrl.searchParams.set('forecast_days', '7');

    const appName = process.env.NOMINATIM_APP_NAME || 'TravelMate/1.0';
    const contactEmail = process.env.NOMINATIM_CONTACT_EMAIL || 'admin@travelmate.app';

    const res = await fetchOpenMeteoJson(openMeteoUrl.toString(), `${appName} (${contactEmail})`);

    if (!res.ok || !res.data) {
      return NextResponse.json(
        { error: `Open-Meteo returned status ${res.status}` },
        { status: 502 }
      );
    }

    const data = res.data;

    if (!data.current || !data.daily) {
      return NextResponse.json(
        { error: 'Incomplete weather data received' },
        { status: 502 }
      );
    }

    const currentWmo = mapWmoCode(data.current.weather_code);

    // Format daily forecasts
    const dailyTimes: string[] = data.daily.time || [];
    const dailyCodes: number[] = data.daily.weather_code || [];
    const dailyMax: number[] = data.daily.temperature_2m_max || [];
    const dailyMin: number[] = data.daily.temperature_2m_min || [];
    const dailyPrecip: number[] = data.daily.precipitation_probability_max || [];

    const forecast: WeatherDayForecast[] = dailyTimes.slice(0, 6).map((dateStr, idx) => {
      const dateObj = new Date(dateStr);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = isNaN(dateObj.getTime()) ? '' : dayNames[dateObj.getDay()];
      const dayLabel = idx === 0 ? 'Today' : dayName;
      const wmo = mapWmoCode(dailyCodes[idx] ?? 0);

      return {
        date: dateStr,
        dayName,
        dayLabel,
        condition: wmo.condition,
        icon: wmo.icon,
        highC: Math.round(dailyMax[idx] ?? 0),
        lowC: Math.round(dailyMin[idx] ?? 0),
        precipitationPercent: Math.round(dailyPrecip[idx] ?? 0),
      };
    });

    // Format sunrise / sunset if available
    let sunriseFormatted: string | undefined;
    let sunsetFormatted: string | undefined;
    if (data.daily.sunrise?.[0]) {
      const d = new Date(data.daily.sunrise[0]);
      if (!isNaN(d.getTime())) {
        sunriseFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    }
    if (data.daily.sunset?.[0]) {
      const d = new Date(data.daily.sunset[0]);
      if (!isNaN(d.getTime())) {
        sunsetFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    }

    const trimmedResponse: TrimmedWeatherResponse = {
      currentTempC: Math.round(data.current.temperature_2m),
      feelsLikeC: Math.round(data.current.apparent_temperature),
      humidity: Math.round(data.current.relative_humidity_2m),
      windKmh: Math.round(data.current.wind_speed_10m),
      condition: currentWmo.condition,
      icon: currentWmo.icon,
      weatherCode: data.current.weather_code,
      sunrise: sunriseFormatted,
      sunset: sunsetFormatted,
      forecast,
    };

    // Store in memory cache
    weatherCache.set(cacheKey, {
      timestamp: Date.now(),
      data: trimmedResponse,
    });

    return NextResponse.json({
      ...trimmedResponse,
      cached: false,
    });
  } catch (err: any) {
    console.error('Weather fetch error:', err);
    return NextResponse.json(
      { error: 'Unable to load weather forecast. Please try again later.' },
      { status: 502 }
    );
  }
}
